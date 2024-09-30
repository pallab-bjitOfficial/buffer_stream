import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Transform, Readable } from 'stream';
import { promisify } from 'util';
import { pipeline } from 'stream/promises';

const app = express();
const PORT = 3000;
let bufferCache: Buffer | null = null;

const fileExists = promisify(fs.exists);

app.get('/buffer', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!bufferCache) {
      const filePath = path.join(__dirname, 'file', 'buffer.txt');
      if (!(await fileExists(filePath))) {
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

app.get('/stream', async (req: Request, res: Response): Promise<void> => {
  try {
    const filePath = path.join(__dirname, 'file', 'stream.txt');
    if (!(await fileExists(filePath))) {
      res.status(404).send('File not found');
      return;
    }

    const readableStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const transformStream = new Transform({
      transform(chunk, encoding, callback) {
        callback(null, chunk.toString().toUpperCase());
      },
    });

    res.setHeader('Content-Type', 'text/plain');
    await pipeline(readableStream, transformStream, res);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/large-stream', (req: Request, res: Response): void => {
  const largeStringStream = new Readable({
    read() {},
  });

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
