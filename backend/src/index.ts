import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { connectMongo, TripProfile } from './db/mongo';
import { redis } from './db/redis';
import { startKafkaConsumer } from './kafka/consumer';
import { processEvent } from './engine/decisionEngine';

dotenv.config();

const app = express();
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        process.env.FRONTEND_URL || ''
    ].filter(Boolean),
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

app.post('/api/ingest/csv', async (req, res) => {
    try {
        const { csvData } = req.body;
        const rows = csvData.trim().split('\n');
        const ingestedIds = [];

        let configStr = await redis.get('global_settings');
        let globalConfig = configStr ? JSON.parse(configStr) : {};
        const emailTpl = globalConfig.outbound_email_html || 'Click here: {link}';

        const transporter = (globalConfig.smtp_host && globalConfig.smtp_user) ? nodemailer.createTransport({
            host: globalConfig.smtp_host,
            port: parseInt(globalConfig.smtp_port) || 587,
            secure: parseInt(globalConfig.smtp_port) === 465,
            auth: {
                user: globalConfig.smtp_user,
                pass: globalConfig.smtp_pass
            }
        }) : null;

        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',');
            if (cols.length < 2) continue;
            const name = cols[0].trim();
            const email = cols[1].trim();
            const intent = cols.length > 2 ? cols[2].trim() : 'General Inquiry';

            const leadId = `import_${Math.random().toString(36).substring(2, 9)}`;

            await TripProfile.create({
                external_user_id: leadId,
                historical_summary: '',
                trip_context: {},
                behavior_profile: {},
                personal_profile: { demographics: name },
                intent_profile: { primary_motivation: intent },
                state_machine: {
                    current_stage: 'INTENT_DISCOVERY',
                    nurturing_pattern_active: 'INTENT_DISCOVERY'
                }
            });
            ingestedIds.push(leadId);

            const magicLink = `http://localhost:5173/chat/${leadId}`;
            const finalHtml = emailTpl.replace(/{name}/g, name).replace(/{email}/g, email).replace(/{link}/g, magicLink);

            if (transporter && email.includes('@')) {
                try {
                    await transporter.sendMail({
                        from: `"TripNour AI Concierge" <${globalConfig.smtp_user}>`,
                        to: email,
                        subject: "Your Personalized Luxury Itinerary Awaits",
                        html: finalHtml
                    });
                    console.log(`✅ [SMTP] Dispatched Magic Link to ${email}`);
                } catch (err: any) {
                    console.error(`❌ [SMTP] Delivery failed for ${email}:`, err.message);
                }
            } else {
                console.log(`\n📧 [SIMULATED EMAIL DISPATCHER -> ${email}] 📧\n${finalHtml}\n===================================`);
            }
        }
        res.json({ success: true, ingested_count: ingestedIds.length });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false });
    }
});

app.post('/api/chat', async (req, res) => {
    const { userId, message } = req.body;
    const event = {
        actor: { user_id: userId || 'user_123' },
        action: 'TRIGGER_AI',
        object: { content: message }
    };
    const responseText = await processEvent(event);
    res.json({ reply: responseText || "Thinking..." });
});

app.get('/api/profiles', async (req, res) => {
    const profiles = await TripProfile.find().sort({ updatedAt: -1 }).limit(50).lean();
    res.json(profiles);
});

app.get('/api/profiles/:id', async (req, res) => {
    const profile = await TripProfile.findOne({ external_user_id: req.params.id }).lean();
    res.json(profile);
});

app.put('/api/profiles/:id/config', async (req, res) => {
    const { language, tone } = req.body;
    await TripProfile.updateOne(
        { external_user_id: req.params.id },
        { $set: { "agent_config.language": language, "agent_config.tone": tone } }
    );
    res.json({ success: true });
});

app.put('/api/profiles/:id/claim', async (req, res) => {
    await TripProfile.updateOne(
        { external_user_id: req.params.id },
        {
            $set: {
                "agent_intervention.claimed_by_agent": true,
                "agent_intervention.requires_intervention": true,
                "state_machine.current_stage": "CLOSURE",
                "state_machine.nurturing_pattern_active": "AGENT_HANDOFF"
            }
        }
    );
    res.json({ success: true });
});

app.get('/api/products/recommendations', async (req, res) => {
    const userId = req.query.userId;
    const profile = await TripProfile.findOne({ external_user_id: userId }).lean();

    try {
        const filePath = path.join(__dirname, '../../docs/products.json');
        const catalog = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let products = catalog.sample_packages || [];

        let matched: any[] = products;

        // 1. Destination Match
        if (profile?.trip_context?.destinations_considered?.length) {
            const dests = profile.trip_context.destinations_considered.map((d: string) => d.toLowerCase());
            matched = matched.filter((p: any) => dests.some((d: string) => p.resort_name.toLowerCase().includes(d) || p.region.toLowerCase().includes(d)));
        }

        // 2. Budget Ceiling Match (Allow 30% flex up)
        if (profile?.trip_context?.budget?.value) {
            const maxBudget = profile.trip_context.budget.value;
            matched = matched.filter((p: any) => p.price_gbp <= maxBudget * 1.3);
        }

        // 3. Vibe Sorting
        if (profile?.intent_profile?.primary_motivation) {
            const vibeText = profile.intent_profile.primary_motivation.toLowerCase();
            matched.sort((a, b) => {
                const aMatch = a.package_type.toLowerCase().includes(vibeText) || a.vibe.toLowerCase().includes(vibeText);
                const bMatch = b.package_type.toLowerCase().includes(vibeText) || b.vibe.toLowerCase().includes(vibeText);
                return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
            });
        }

        // Fill up to 5 if needed
        if (matched.length < 5) {
            const others = products.filter((p: any) => !matched.includes(p));
            others.sort(() => 0.5 - Math.random());
            matched = matched.concat(others.slice(0, 5 - matched.length));
        }

        res.json(matched.slice(0, 5));
    } catch (e) {
        console.error(e);
        res.json([]);
    }
});

app.get('/api/settings', async (req, res) => {
    try {
        const config = await redis.get('global_settings');
        res.json(config ? JSON.parse(config) : {});
    } catch (e) {
        res.json({});
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        await redis.set('global_settings', JSON.stringify(req.body));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

app.get('/health', async (req, res) => {
    const mongoState = require('mongoose').connection.readyState === 1 ? 'OK' : 'DOWN';
    const redisState = redis.status === 'ready' ? 'OK' : 'DOWN';

    res.json({
        status: 'online',
        services: {
            mongo: mongoState,
            redis: redisState
        }
    });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
    console.log(`🚀 TripNour Backend Engine running on port ${PORT}`);

    // Connect to Backing Services
    await connectMongo();

    // Init Kafka Event Stream
    await startKafkaConsumer();
});
