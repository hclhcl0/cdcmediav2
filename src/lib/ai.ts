import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseOffice } from "officeparser";
import { prisma } from "@/lib/prisma";

export async function getGeminiKey(): Promise<string | null> {
  const setting = await prisma.appSetting.findUnique({ where: { key: "gemini_api_key" } });
  return setting?.value || process.env.GEMINI_API_KEY || null;
}

export async function extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  if (ext === 'txt') {
    return buffer.toString('utf-8');
  }

  // Attempt to use officeparser
  const result: any = await parseOffice(buffer, {
    fileType: ext as any,
    ignoreNotes: true,
    newline_delimiter: "\n"
  });
  
  if (result && typeof result.toText === 'function') {
    return result.toText() || "";
  }
  
  return typeof result === 'string' ? result : "";
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimes: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'heic': 'image/heic',
    'heif': 'image/heif',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'mp4': 'video/mp4',
    'mpeg': 'video/mpeg',
    'mov': 'video/mov',
    'avi': 'video/avi',
    'webm': 'video/webm',
    'mp3': 'audio/mp3',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac'
  };
  return mimes[ext] || 'application/octet-stream';
}

export async function generateFileDescription(buffer: Buffer, filename: string, apiKey: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const mimeType = getMimeType(filename);
  const isNativeSupported = ['image/', 'application/pdf', 'video/', 'audio/', 'text/plain'].some(prefix => mimeType.startsWith(prefix));
  
  const prompt = `Bạn là một trợ lý ảo thông minh. 
Nhiệm vụ: Phân tích tài liệu / tệp đính kèm có tên "${filename}" và viết một đoạn mô tả (description) ngắn gọn, súc tích và chuyên nghiệp (khoảng 2-4 câu) để tóm tắt nội dung chính.
LƯU Ý QUAN TRỌNG:
- Chỉ trả về duy nhất đoạn văn bản mô tả, không thêm bình luận, không dùng markdown in đậm/nghiêng.`;

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash", 
    "gemini-1.5-flash-latest", 
    "gemini-1.5-flash", 
    "gemini-1.5-pro-latest", 
    "gemini-1.5-pro",
    "gemini-pro"
  ];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      let result;

      if (isNativeSupported && buffer.length < 19 * 1024 * 1024 && modelName !== "gemini-pro") {
         result = await model.generateContent([
           prompt,
           {
             inlineData: {
               data: buffer.toString("base64"),
               mimeType
             }
           }
         ]);
      } else {
         let text = "";
         try {
           text = await extractTextFromFile(buffer, filename);
         } catch (err: any) {
           throw new Error("Lỗi khi đọc nội dung file: " + err.message);
         }
         
         if (!text || text.trim().length < 10) {
           throw new Error("NO_TEXT");
         }
         
         const truncatedText = text.substring(0, 50000);
         result = await model.generateContent([
           `${prompt}\n\nNội dung văn bản trích xuất:\n"""\n${truncatedText}\n"""`
         ]);
      }

      const response = await result.response;
      let description = response.text().trim();
      description = description.replace(/\*\*/g, "").replace(/#/g, "");
      return description; // Success! Return immediately.
    } catch (err: any) {
      lastError = err;
      // If it's a 404 (model not found), continue to the next model
      if (err.message && err.message.includes("404")) {
        continue;
      }
      // If NO_TEXT, it's not a model issue, so break and throw it
      if (err.message === "NO_TEXT" || err.message.includes("Lỗi khi đọc nội dung file")) {
        throw err; 
      }
      // If it's some other API error (e.g. invalid key), continue or throw?
      // For safety, we will try the next model just in case it's a multimodal capability issue
    }
  }

  // If all models fail, throw the last error
  throw new Error("Tất cả phiên bản AI đều báo lỗi: " + lastError?.message);
}
