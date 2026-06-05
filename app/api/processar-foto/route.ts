import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────
// API Route: POST /api/processar-foto
//
// Passo 1: Remove fundo com fal-ai/birefnet (modelo mais confiável)
// Passo 2: Aplica camiseta com fashn/tryon
//
// Variável de ambiente necessária:
//   FAL_KEY=sua_chave_aqui
// ─────────────────────────────────────────────────────────────────

// Camiseta da Seleção Brasileira — imagem pública para o try-on
const CAMISETA_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/2022_Brazil_home_kit.png/220px-2022_Brazil_home_kit.png";

async function uploadParaFal(base64: string, mimeType: string, falKey: string): Promise<string> {
  const resp = await fetch("https://fal.run/fal-ai/storage/upload/base64", {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: `data:${mimeType};base64,${base64}` }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Upload falhou: ${err.slice(0, 200)}`);
  }

  const data = await resp.json();
  return data.url;
}

async function removerFundo(imageUrl: string, falKey: string): Promise<string> {
  const resp = await fetch("https://fal.run/fal-ai/birefnet", {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: imageUrl,
      model: "General Use (Light)",
      operating_resolution: "1024x1024",
      output_format: "png",
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Remoção de fundo falhou: ${err.slice(0, 200)}`);
  }

  const data = await resp.json();
  const url = data?.image?.url || data?.images?.[0]?.url;
  if (!url) throw new Error("fal.ai birefnet não retornou imagem");
  return url;
}

async function aplicarCamiseta(imageUrl: string, falKey: string): Promise<string> {
  const resp = await fetch("https://fal.run/fashn/tryon", {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_image: imageUrl,
      garment_image: CAMISETA_URL,
      category: "tops",
      flat_lay: false,
      adjust_hands: true,
      restore_background: false,
      restore_clothes: false,
      guidance_scale: 2,
      timesteps: 50,
      num_samples: 1,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Try-on falhou: ${err.slice(0, 200)}`);
  }

  const data = await resp.json();
  const url = data?.images?.[0]?.url || data?.image?.url;
  if (!url) throw new Error("fashn/tryon não retornou imagem");
  return url;
}

export async function POST(req: NextRequest) {
  try {
    const FAL_KEY = process.env.FAL_KEY;
    if (!FAL_KEY) {
      return NextResponse.json(
        { error: "FAL_KEY não configurada no Vercel" },
        { status: 500 }
      );
    }

    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Imagem não recebida" }, { status: 400 });
    }

    // Passo 1: Upload da foto original
    console.log("📤 Enviando foto para fal.ai...");
    const uploadedUrl = await uploadParaFal(imageBase64, mimeType || "image/jpeg", FAL_KEY);
    console.log("✅ Upload feito:", uploadedUrl);

    // Passo 2: Aplicar camiseta (fashn/tryon funciona melhor com fundo)
    console.log("👕 Aplicando camiseta da Seleção...");
    const comCamiseta = await aplicarCamiseta(uploadedUrl, FAL_KEY);
    console.log("✅ Camiseta aplicada:", comCamiseta);

    // Passo 3: Remover fundo da foto com camiseta
    console.log("✂️ Removendo fundo...");
    const semFundo = await removerFundo(comCamiseta, FAL_KEY);
    console.log("✅ Fundo removido:", semFundo);

    return NextResponse.json({ imageUrl: semFundo });

  } catch (err) {
    console.error("❌ Erro em /api/processar-foto:", err);
    const mensagem = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: mensagem }, { status: 502 });
  }
}
