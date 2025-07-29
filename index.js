// index.js - Main entry point
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import supabase from './lib/supabase-client.js';
import formidable from 'formidable';

// Disable Vercel's default body parser for file uploads
export const config = {
  api: {
    bodyParser: false
  }
};


const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
// Serve main page
app.get('/', async (req, res) => {
  try {
    const filePath = join(__dirname, 'public/mainpage.html');
    const content = await fs.readFile(filePath, 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.send(content);
  } catch (err) {
    console.error('Error serving main page:', err);
    res.status(500).send('Could not load main page');
  }
});

// Login routes
app.get('/login', async (req, res) => {
  try {
    const filePath = join(__dirname, 'public/admin.html');
    const content = await fs.readFile(filePath, 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.send(content);
  } catch (err) {
    console.error('Error serving login page:', err);
    res.status(500).send('Could not load login page');
  }
});

app.post('/login/verify', (req, res) => {
  const { username, password } = req.body;
  const validUsername = process.env.USERNAME;
  const validPassword = process.env.PASSWORD;

  if (username === validUsername && password === validPassword) {
    return res.status(200).json({ success: true, message: 'Login successful' });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// Upload event image
app.post('/api/upload-event', (req, res) => {

  // ✅ Debug logging should go here at the very start
  console.log("📌 Upload route hit");
  console.log("📌 SUPABASE_URL:", process.env.SUPABASE_URL);
  console.log("📌 SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Loaded" : "❌ Missing");

  const form = formidable({ multiples: false }); // create form instance

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: 'File parsing failed' });
    }

    const file = files.eventImage;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const fileArray = Array.isArray(file) ? file : [file];
      const uploadedFile = fileArray[0];
      




      // ✅ More debug logs before Supabase call
      console.log("📌 Uploaded file:", uploadedFile.originalFilename);
      console.log("📌 File size:", uploadedFile.size);


      const fileBuffer = await fs.readFile(uploadedFile.filepath);
      const fileExt = uploadedFile.originalFilename?.split('.').pop() || 'jpg';
      const fileName = `event-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(fileName, fileBuffer, {
          contentType: uploadedFile.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return res.status(500).json({ 
        error: 'Upload to Supabase Storage failed', 
        details: error.message 
      });
    }


      const { data: publicData } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      const publicUrl = publicData.publicUrl;

      console.log("📌 Public URL generated:", publicUrl);






      const insertResult = await supabase
        .from('event_images')
        .insert([{ file_name: fileName, url: publicUrl }]);

      if (insertResult.error) {
        console.error("DB insert error:", insertResult.error);
      }

      res.status(200).json({
        message: 'Upload successful',
        imageUrl: publicUrl,
      });
    } catch (uploadError) {
      console.error("Upload processing error:", uploadError);
      res.status(500).json({ error: 'Failed to process upload' });
    }
  });
});


// Delete event
app.delete('/delete-event/:id', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (imageUrl) {
      // Extract filename from URL
      const fileName = imageUrl.split('/').pop();
      
      if (fileName) {
        const { error } = await supabase.storage
          .from('event-images')
          .remove([fileName]);
        
        if (error) {
          console.error("File deletion error:", error);
          return res.status(500).json({ error: 'Failed to delete image file' });
        }
      }
    }
    
    res.json({ message: 'Event and image deleted successfully' });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Change password
app.post('/change-password', (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  
  // Validate old password
  if (oldPassword !== process.env.PASSWORD) {
    return res.status(400).json({ error: 'Password lama tidak benar' });
  }
  
  // Validate new password
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Konfirmasi password tidak cocok' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
  }
  
  // In a real app, you would update the password in your database
  // For now, we'll just return success
  res.json({ message: 'Password berhasil diubah' });
});

app.get('/mainpage', async (req, res) => {
  try {
    const filePath = join(__dirname, 'public/mainpage.html');
    const content = await fs.readFile(filePath, 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.send(content);
  } catch (err) {
    console.error('Error serving main page:', err);
    res.status(500).send('Could not load main page');
  }
});

// Catch-all route for SPA
app.get(/.*/, async (req, res) => {
  try {
    const filePath = join(__dirname, 'public/admin.html');
    const content = await fs.readFile(filePath, 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.send(content);
  } catch (err) {
    console.error('Error in catch-all route:', err);
    res.status(404).send('Page not found');
  }
});

// Start server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

export default app;