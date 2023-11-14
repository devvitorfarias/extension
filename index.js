import multer from "multer";
import { readFileSync } from "fs";
import express from "express";
import cors from "cors";
import { SpeechClient } from "@google-cloud/speech";

const app = express();
const port = 3000;

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
});

const upload = multer({ storage });

const client = new SpeechClient(
  {
    credentials: {
      // Aqui vai suas credenciais
    }
  }
);

app.use(express.json());
app.use(cors());

app.post("/upload_files", upload.any("file"), (req, res) => {
  res.send({ message: "Successfully uploaded files" });
});

app.post("/transcribe", async (req, res) => {
  const filename = req.body.filename;
  console.log('filename', filename)
  const audio = `./uploads/${filename}`;

  const config = {
    encoding: "MP3",
    sampleRateHertz: 32000,
    languageCode: "pt-BR",
  };

  const request = {
    config,
    audio: {
      content: readFileSync(audio).toString("base64"),
    },
  };

  try {
    const [response] = await client.recognize(request);
    const transcription = response.results
      .map((result) => result.alternatives[0].transcript)
      .join("\n");
    console.log("Transcription: ", response.results);
    if (response.results.length === 0) {
      return res.json({ transcription: "No transcription found" });
    }
    return res.json({ transcription });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Error transcribing audio" });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
