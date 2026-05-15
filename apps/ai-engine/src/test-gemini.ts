import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Using Key:", apiKey?.substring(0, 10) + "...");

  for (const version of ["v1", "v1beta"]) {
    try {
      const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`;
      const res = await fetch(url);
      const data: any = await res.json();
      
      if (data.models) {
        console.log(`\n=== Models available in ${version} ===`);
        data.models.forEach((m: any) => {
          if (m.supportedGenerationMethods?.includes("generateContent")) {
            console.log(`✅ ${m.name}`);
          }
        });
      } else {
        console.log(`\n${version} Error:`, JSON.stringify(data.error));
      }
    } catch (e: any) {
      console.log(`${version} fetch error:`, e.message);
    }
  }
}

listModels();
