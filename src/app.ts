import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Transform, Readable } from 'stream';
import { promisify } from 'util';
import { pipeline } from 'stream/promises';

const app = express();
const PORT = 3000;

// Caching example: Cache buffer file contents in memory for efficiency
let bufferCache: Buffer | null = null;

const fileExists = promisify(fs.exists);

// Async handler for buffer
app.get('/buffer', async (req: Request, res: Response): Promise<void> => {
  try {
    // If cache is empty, read file asynchronously
    if (!bufferCache) {
      const filePath = path.join(__dirname, 'file', 'buffer.txt');
      const exists = await fileExists(filePath);

      if (!exists) {
        res.status(404).send('File not found');
        return;
      }

      const data = await fs.promises.readFile(filePath, 'utf-8');
      bufferCache = Buffer.from(data, 'utf-8');
    }

    res.setHeader('Content-Type', 'text/plain');
    res.send(bufferCache);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Stream file using streaming API and add transformation on the fly
app.get('/stream', async (req: Request, res: Response): Promise<void> => {
  try {
    const filePath = path.join(__dirname, 'file', 'stream.txt');
    const exists = await fileExists(filePath);

    if (!exists) {
      res.status(404).send('File not found');
      return;
    }

    const readableStream = fs.createReadStream(filePath, { encoding: 'utf-8' });

    // Create a Transform stream to manipulate the file content on the fly
    const transformStream = new Transform({
      transform(chunk, encoding, callback) {
        // Example transformation: Append custom data to each chunk
        const modifiedChunk = chunk.toString().toUpperCase(); // Modify chunk (example: uppercase)
        callback(null, modifiedChunk);
      },
    });

    res.setHeader('Content-Type', 'text/plain');

    // Pipe through the transformation stream and then to the response
    await pipeline(readableStream, transformStream, res);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Simulate large streaming without loading into memory
app.get('/large-stream', (req: Request, res: Response): void => {
  const largeStringStream = new Readable({
    read() {},
  });

  // Generate a large string chunk-by-chunk (simulating large data)
  for (let i = 0; i < 10000; i++) {
    largeStringStream.push(`This is chunk number ${i}\n`);
  }
  largeStringStream.push(null);

  res.setHeader('Content-Type', 'text/plain');
  largeStringStream.pipe(res);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
