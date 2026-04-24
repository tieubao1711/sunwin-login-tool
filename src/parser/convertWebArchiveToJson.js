const fs = require("fs");
const path = require("path");
const plist = require("plist");
const bplist = require("bplist-parser");
const cheerio = require("cheerio");

const INPUT_FILE = path.resolve(__dirname, "../../src/parser/ReportDataReal.xlsx 3.webarchive");
const OUTPUT_FILE = path.resolve(__dirname, "../../src/parser/kendy3-3.json");

function isBinaryPlist(buffer) {
  return buffer.slice(0, 8).toString() === "bplist00";
}

function parseWebArchive(filePath) {
  const rawBuffer = fs.readFileSync(filePath);

  if (isBinaryPlist(rawBuffer)) {
    const result = bplist.parseBuffer(rawBuffer);
    if (!result || !result.length) {
      throw new Error("Không parse được binary plist");
    }
    return result[0];
  }

  return plist.parse(rawBuffer.toString("utf8"));
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dataToBuffer(data) {
  if (!data) return null;
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (typeof data === "string") return Buffer.from(data, "utf8");
  if (Array.isArray(data?.data)) return Buffer.from(data.data);
  return null;
}

function extractHtml(parsed) {
  const main = parsed?.WebMainResource;
  if (!main) {
    throw new Error("Không có WebMainResource");
  }

  const raw = main.WebResourceData;
  const buf = dataToBuffer(raw);

  if (!buf) {
    throw new Error("Không đọc được WebResourceData");
  }

  const html = buf.toString(main.WebResourceTextEncodingName || "utf8");

  if (!html || !html.includes("<")) {
    throw new Error("WebResourceData không chứa HTML hợp lệ");
  }

  return html;
}

function getRowsFromBestTable(html) {
  const $ = cheerio.load(html);
  let selectedRows = null;
  let selectedScore = -1;

  $("table").each((_, table) => {
    const rows = [];

    $(table)
      .find("tr")
      .each((__, tr) => {
        const cells = [];
        $(tr)
          .find("th, td")
          .each((___, cell) => {
            cells.push(normalizeText($(cell).text()));
          });

        if (cells.some(Boolean)) {
          rows.push(cells);
        }
      });

    if (!rows.length) return;

    const header = rows[0].map(x => x.toLowerCase());

    const score =
      (header.includes("username") ? 3 : 0) +
      (header.includes("display name") ? 3 : 0) +
      (header.includes("password") ? 3 : 0) +
      (header.includes("create time") ? 1 : 0);

    if (score > selectedScore) {
      selectedScore = score;
      selectedRows = rows;
    }
  });

  if (!selectedRows) {
    throw new Error("Không tìm thấy table nào trong HTML");
  }

  return selectedRows;
}

function convertRowsToJson(rows) {
  const headers = rows[0].map(h => normalizeText(h).toLowerCase());

  const usernameIndex = headers.indexOf("username");
  const nicknameIndex = headers.indexOf("display name");
  const passwordIndex = headers.indexOf("password");

  if (usernameIndex === -1 || nicknameIndex === -1 || passwordIndex === -1) {
    throw new Error(
      `Không tìm thấy đủ cột. Header hiện có: ${headers.join(" | ")}`
    );
  }

  return rows
    .slice(1)
    .map(row => ({
      nickname: normalizeText(row[nicknameIndex] || ""),
      username: normalizeText(row[usernameIndex] || ""),
      password: normalizeText(row[passwordIndex] || "")
    }))
    .filter(item => item.username || item.nickname || item.password);
}

function main() {
  try {
    const parsed = parseWebArchive(INPUT_FILE);
    const html = extractHtml(parsed);

    fs.writeFileSync(
      path.resolve(__dirname, "../../debug.html"),
      html,
      "utf8"
    );

    const rows = getRowsFromBestTable(html);
    const result = convertRowsToJson(rows);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), "utf8");

    console.log(`Đã xuất ${result.length} dòng ra: ${OUTPUT_FILE}`);
  } catch (err) {
    console.error("Lỗi:", err.message);
  }
}

main();