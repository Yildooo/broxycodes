const { MongoClient, ObjectId } = require('mongodb');

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

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    try {
        const client = await connectToDatabase();
        const db = client.db('broxycode');
        const collection = db.collection('portfolio');

        if (event.httpMethod === 'GET') {
            const portfolio = await collection
                .find({})
                .sort({ createdAt: -1 })
                .toArray();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    portfolio: portfolio
                }),
            };
        }

        if (event.httpMethod === 'POST') {
            const { title, description, technologies, imageUrl, projectUrl, features, client: projectClient, duration, year } = JSON.parse(event.body);

            // Validation
            if (!title || !description) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Title and description are required'
                    }),
                };
            }

            const portfolioData = {
                title: title.trim(),
                description: description.trim(),
                technologies: technologies || [],
                imageUrl: imageUrl || '',
                projectUrl: projectUrl || '',
                features: features || [],
                client: projectClient || '',
                duration: duration || '',
                year: year || new Date().getFullYear().toString(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await collection.insertOne(portfolioData);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Portfolio item created successfully',
                    id: result.insertedId
                }),
            };
        }

        if (event.httpMethod === 'PUT') {
            const { id, title, description, technologies, imageUrl, projectUrl, features, client: projectClient, duration, year } = JSON.parse(event.body);

            if (!id || !ObjectId.isValid(id)) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Valid ID is required'
                    }),
                };
            }

            const updateData = {
                title: title?.trim(),
                description: description?.trim(),
                technologies: technologies || [],
                imageUrl: imageUrl || '',
                projectUrl: projectUrl || '',
                features: features || [],
                client: projectClient || '',
                duration: duration || '',
                year: year || new Date().getFullYear().toString(),
                updatedAt: new Date()
            };

            // Remove undefined values
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            const result = await collection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );

            if (result.matchedCount === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Portfolio item not found'
                    }),
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Portfolio item updated successfully'
                }),
            };
        }

        if (event.httpMethod === 'DELETE') {
            const { id } = JSON.parse(event.body);

            if (!id || !ObjectId.isValid(id)) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Valid ID is required'
                    }),
                };
            }

            const result = await collection.deleteOne({ _id: new ObjectId(id) });

            if (result.deletedCount === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Portfolio item not found'
                    }),
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Portfolio item deleted successfully'
                }),
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Method not allowed'
            }),
        };

    } catch (error) {
        console.error('Portfolio API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Server error occurred'
            }),
        };
    }
};
