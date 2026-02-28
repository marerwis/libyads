const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        const config = await prisma.metaSetting.findFirst();
        if (!config) { console.log('no config'); process.exit(1); }
        const searchCities = ['Benghazi', 'Al Jabal al Akhdar', 'Marj', 'Tobruk', 'Derna', 'Ajdabiya', 'Misrata', 'Tarhuna', 'Tripoli', 'Jabal al Gharbi'];

        for (const city of searchCities) {
            const url = `https://graph.facebook.com/v19.0/search?type=adgeolocation&q=${encodeURIComponent(city)}&location_types=['city','region']&access_token=${config.systemUserToken}`;
            const res = await fetch(url); // Next.js native fetch or Node.js native fetch (v18+)
            const data = await res.json();
            if (data.data) {
                console.log(city, data.data.filter(d => d.country_code === 'LY').map(d => ({ key: d.key, name: d.name, type: d.type })));
            } else {
                console.log(`Failed for ${city}:`, data);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
})();
