const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/tripnour_db').then(async () => {
    const db = mongoose.connection.db;
    const targetUserId = process.argv[2] || 'visitor_e1193';
    const profile = await db.collection('tripprofiles').findOne({ external_user_id: targetUserId });
    if (!profile) {
        console.log("NO PROFILE FOUND");
        process.exit(0);
    }
    console.log("============= HISTORICAL SUMMARY =============");
    console.log(profile.historical_summary || "Empty");
    console.log("============= RECENT INTERACTIONS =============");
    console.log(JSON.stringify(profile.recent_interactions || [], null, 2));
    console.log("============= SCORES & STATE =============");
    console.log(JSON.stringify(profile.state_machine || {}, null, 2));
    console.log(JSON.stringify(profile.derived_scores || {}, null, 2));
    console.log("============= TRIP CONTEXT =============");
    console.log(JSON.stringify(profile.trip_context || {}, null, 2));
    console.log("============= INTENT / PERSONAL =============");
    console.log(JSON.stringify(profile.intent_profile || {}, null, 2));
    console.log(JSON.stringify(profile.personal_profile || {}, null, 2));
    process.exit(0);
});
