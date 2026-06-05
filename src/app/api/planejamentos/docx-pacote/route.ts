import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../server/auth/api-access";
import {
  buildOfficialPlanningDocx,
  getOfficialPlanningFilename,
  type OfficialPlanningPayload,
} from "../../../../server/planejamentos/official-planning-docx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ZipFile = {
  name: string;
  data: Buffer;
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let n = 0; n < 256; n += 1) {
    let c = n;

    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }

    table[n] = c >>> 0;
  }

  return table;
})();

function crc32(input: Buffer): number {
  let crc = 0xffffffff;

  for (const byte of input) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number): Buffer {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value & 0xffff, 0);
  return buffer;
}

function u32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  return buffer;
}

function getDosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);

  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    date:
      ((year - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
  };
}

function buildZip(files: ZipFile[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const now = getDosDateTime();

  for (const file of files) {
    const fileName = Buffer.from(file.name.replace(/\\/g, "/"), "utf8");
    const content = file.data;
    const checksum = crc32(content);

    const localHeader = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(now.time),
      u16(now.date),
      u32(checksum),
      u32(content.length),
      u32(content.length),
      u16(fileName.length),
      u16(0),
      fileName,
    ]);

    localParts.push(localHeader, content);

    const centralHeader = Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(now.time),
      u16(now.date),
      u32(checksum),
      u32(content.length),
      u32(content.length),
      u16(fileName.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      fileName,
    ]);

    centralParts.push(centralHeader);
    offset += localHeader.length + content.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localData = Buffer.concat(localParts);

  return Buffer.concat([
    localData,
    centralDirectory,
    Buffer.concat([
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(files.length),
      u16(files.length),
      u32(centralDirectory.length),
      u32(localData.length),
      u16(0),
    ]),
  ]);
}

function safeFilename(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 90) || "planify"
  );
}

function createDocument(
  payload: OfficialPlanningPayload,
  tipoPlanejamento: "anual" | "trimestral",
  trimestre?: number,
): ZipFile {
  const documentPayload: OfficialPlanningPayload = {
    ...payload,
    tipoPlanejamento,
    trimestre: trimestre ? String(trimestre) : payload.trimestre,
  };

  const data = buildOfficialPlanningDocx(documentPayload);
  const filename = `${getOfficialPlanningFilename(documentPayload)}.docx`;

  return {
    name: filename,
    data,
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  try {
    const payload = (await request.json()) as OfficialPlanningPayload;

    if (!payload?.matrizPlanejamento?.conteudos?.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "Gere o planejamento anual com IA antes de baixar anual + trimestrais.",
          },
        },
        { status: 400 },
      );
    }

    const files: ZipFile[] = [
      createDocument(payload, "anual"),
      createDocument(payload, "trimestral", 1),
      createDocument(payload, "trimestral", 2),
      createDocument(payload, "trimestral", 3),
    ];

    const zip = buildZip(files);
    const zipBody = new Blob([new Uint8Array(zip)], {
      type: "application/zip",
    });

    const component =
      typeof payload.componenteCurricular === "string"
        ? payload.componenteCurricular
        : "planejamentos";
    const year = typeof payload.anoSerie === "string" ? payload.anoSerie : "planify";
    const filename = `${safeFilename(`planify-anual-trimestrais-${component}-${year}`)}.zip`;

    return new NextResponse(zipBody, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível gerar o pacote anual + trimestrais.",
        },
      },
      { status: 500 },
    );
  }
}
