const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');

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

async function sendEmailNotification(contactData) {
    try {
        // Gmail SMTP configuration
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER || 'yilma.0601z@gmail.com',
                pass: process.env.GMAIL_APP_PASSWORD // Gmail App Password
            }
        });

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                    <h1>🚀 Broxy Code - Yeni İletişim Mesajı</h1>
                </div>
                <div style="padding: 20px; background: #f8f9fa;">
                    <h2 style="color: #333;">Yeni Müşteri Mesajı</h2>
                    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <p><strong>👤 Ad Soyad:</strong> ${contactData.name}</p>
                        <p><strong>📧 E-posta:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>
                        ${contactData.phone ? `<p><strong>📞 Telefon:</strong> <a href="tel:${contactData.phone}">${contactData.phone}</a></p>` : ''}
                        <p><strong>💬 Mesaj:</strong></p>
                        <div style="background: #f1f3f4; padding: 15px; border-radius: 5px; margin: 10px 0;">
                            ${contactData.message.replace(/\n/g, '<br>')}
                        </div>
                        <hr style="margin: 20px 0;">
                        <p><strong>🕒 Tarih:</strong> ${new Date(contactData.createdAt).toLocaleString('tr-TR')}</p>
                        <p><strong>🌐 IP Adresi:</strong> ${contactData.ip}</p>
                        <p><strong>💻 Tarayıcı:</strong> ${contactData.userAgent}</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="https://broxycode.netlify.app/admin.html"
                           style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; display: inline-block;">
                            📊 Admin Paneline Git
                        </a>
                    </div>
                </div>
                <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
                    <p>Bu mesaj Broxy Code iletişim formu üzerinden gönderilmiştir.</p>
                    <p>🌐 <a href="https://broxycode.netlify.app" style="color: #667eea;">broxycode.netlify.app</a></p>
                </div>
            </div>
        `;

        const mailOptions = {
            from: `"Broxy Code Website" <${process.env.GMAIL_USER || 'yilma.0601z@gmail.com'}>`,
            to: 'yilma.0601z@gmail.com',
            subject: `🚀 Yeni İletişim Mesajı - ${contactData.name}`,
            html: emailHtml,
            replyTo: contactData.email
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error: error.message };
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
            const { name, email, phone, message } = JSON.parse(event.body);

            // Validation
            if (!name || !email || !message) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Name, email, and message are required'
                    }),
                };
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Invalid email format'
                    }),
                };
            }

            const client = await connectToDatabase();
            const db = client.db('broxycode');
            const collection = db.collection('contacts');

            const contactData = {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone ? phone.trim() : null,
                message: message.trim(),
                ip: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown',
                userAgent: event.headers['user-agent'] || 'unknown',
                createdAt: new Date(),
                status: 'new'
            };

            const result = await collection.insertOne(contactData);

            // Send email notification
            const emailResult = await sendEmailNotification(contactData);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Message sent successfully',
                    id: result.insertedId,
                    emailSent: emailResult.success,
                    emailInfo: emailResult.success ? 'Email notification sent to admin' : 'Email notification failed'
                }),
            };

        } catch (error) {
            console.error('Contact form error:', error);
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
            const collection = db.collection('contacts');

            const contacts = await collection
                .find({})
                .sort({ createdAt: -1 })
                .limit(50)
                .toArray();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    contacts: contacts
                }),
            };

        } catch (error) {
            console.error('Get contacts error:', error);
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
