const { MongoClient } = require('mongodb');

let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) {
        return cachedClient;
    }

    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
        throw new Error('MongoDB URI not found in environment variables');
    }

    const client = new MongoClient(mongoUri);
    await client.connect();
    cachedClient = client;
    return client;
}

function parseUserAgent(userAgent) {
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    const isTablet = /iPad|Tablet/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;

    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return {
        type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        browser,
        os,
        isMobile,
        isTablet,
        isDesktop
    };
}

async function getGeoData(ip) {
    try {
        // Basic geo data - in production you might use a service like ipapi.co
        if (ip === 'unknown' || ip.includes('127.0.0.1') || ip.includes('localhost')) {
            return {
                country: 'Unknown',
                city: 'Unknown',
                region: 'Unknown',
                timezone: 'Unknown'
            };
        }

        // For demo purposes, return Turkey data
        return {
            country: 'Turkey',
            city: 'Istanbul',
            region: 'Marmara',
            timezone: 'Europe/Istanbul'
        };
    } catch (error) {
        return {
            country: 'Unknown',
            city: 'Unknown',
            region: 'Unknown',
            timezone: 'Unknown'
        };
    }
}

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function updateRealtimeVisitors(db, sessionId) {
    try {
        const realtimeCollection = db.collection('realtime_visitors');
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        // Remove old sessions (older than 5 minutes)
        await realtimeCollection.deleteMany({
            lastSeen: { $lt: fiveMinutesAgo }
        });

        // Update or insert current session
        await realtimeCollection.updateOne(
            { sessionId },
            {
                $set: {
                    sessionId,
                    lastSeen: now,
                    date: now.toISOString().split('T')[0]
                }
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('Error updating realtime visitors:', error);
    }
}

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    if (event.httpMethod === 'POST') {
        try {
            const { type, page, userAgent, referrer, sessionId } = JSON.parse(event.body);

            const client = await connectToDatabase();
            const db = client.db('broxycode');
            const collection = db.collection('analytics');

            // Get IP and try to get geographic data
            const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
            const userAgentString = userAgent || event.headers['user-agent'] || 'unknown';

            // Parse user agent for device info
            const deviceInfo = parseUserAgent(userAgentString);

            // Get geographic data (basic implementation)
            const geoData = await getGeoData(clientIP);

            const analyticsData = {
                type: type || 'page_view',
                page: page || '/',
                userAgent: userAgentString,
                referrer: referrer || event.headers.referer || 'direct',
                ip: clientIP,
                sessionId: sessionId || generateSessionId(),
                device: deviceInfo,
                geo: geoData,
                timestamp: new Date(),
                date: new Date().toISOString().split('T')[0],
                hour: new Date().getHours(),
                dayOfWeek: new Date().getDay()
            };

            await collection.insertOne(analyticsData);

            // Update real-time visitor count
            await updateRealtimeVisitors(db, analyticsData.sessionId);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Analytics data recorded'
                }),
            };

        } catch (error) {
            console.error('Analytics error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Server error occurred'
                }),
            };
        }
    }

    if (event.httpMethod === 'GET') {
        try {
            const client = await connectToDatabase();
            const db = client.db('broxycode');
            const analyticsCollection = db.collection('analytics');
            const contactsCollection = db.collection('contacts');
            const portfolioCollection = db.collection('portfolio');
            const realtimeCollection = db.collection('realtime_visitors');

            // Get overview statistics
            const totalVisits = await analyticsCollection.countDocuments();
            const todayVisits = await analyticsCollection.countDocuments({
                date: new Date().toISOString().split('T')[0]
            });
            const totalContacts = await contactsCollection.countDocuments();
            const portfolioCount = await portfolioCollection.countDocuments();

            // Get unique visitors (by session)
            const uniqueVisitors = await analyticsCollection.distinct('sessionId').then(sessions => sessions.length);
            const todayUniqueVisitors = await analyticsCollection.distinct('sessionId', {
                date: new Date().toISOString().split('T')[0]
            }).then(sessions => sessions.length);

            // Get real-time visitors (active in last 5 minutes)
            const realtimeVisitors = await realtimeCollection.countDocuments();

            // Get page statistics
            const pageStats = await analyticsCollection.aggregate([
                { $group: { _id: '$page', count: { $sum: 1 }, uniqueVisitors: { $addToSet: '$sessionId' } } },
                { $project: { page: '$_id', count: 1, uniqueVisitors: { $size: '$uniqueVisitors' } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]).toArray();

            // Get device statistics
            const deviceStats = await analyticsCollection.aggregate([
                { $group: { _id: '$device.type', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]).toArray();

            // Get browser statistics
            const browserStats = await analyticsCollection.aggregate([
                { $group: { _id: '$device.browser', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]).toArray();

            // Get geographic statistics
            const geoStats = await analyticsCollection.aggregate([
                { $group: { _id: '$geo.country', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]).toArray();

            // Get recent visits with more details
            const recentVisits = await analyticsCollection
                .find({})
                .sort({ timestamp: -1 })
                .limit(20)
                .toArray();

            // Get hourly statistics for today
            const hourlyStats = await analyticsCollection.aggregate([
                {
                    $match: {
                        date: new Date().toISOString().split('T')[0]
                    }
                },
                {
                    $group: {
                        _id: '$hour',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]).toArray();

            // Get daily visits for the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const dailyVisits = await analyticsCollection.aggregate([
                {
                    $match: {
                        timestamp: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: '$date',
                        count: { $sum: 1 },
                        uniqueVisitors: { $addToSet: '$sessionId' }
                    }
                },
                {
                    $project: {
                        date: '$_id',
                        count: 1,
                        uniqueVisitors: { $size: '$uniqueVisitors' }
                    }
                },
                { $sort: { date: 1 } }
            ]).toArray();

            // Get referrer statistics
            const referrerStats = await analyticsCollection.aggregate([
                { $match: { referrer: { $ne: 'direct' } } },
                { $group: { _id: '$referrer', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]).toArray();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: {
                        overview: {
                            totalVisits,
                            todayVisits,
                            uniqueVisitors,
                            todayUniqueVisitors,
                            realtimeVisitors,
                            totalContacts,
                            portfolioCount
                        },
                        pageStats,
                        deviceStats,
                        browserStats,
                        geoStats,
                        recentVisits,
                        hourlyStats,
                        dailyVisits,
                        referrerStats,
                        lastUpdated: new Date().toISOString()
                    }
                }),
            };

        } catch (error) {
            console.error('Get analytics error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Server error occurred'
                }),
            };
        }
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({
            success: false,
            error: 'Method not allowed'
        }),
    };
};
