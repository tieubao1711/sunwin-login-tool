const fs = require("fs");
const path = require("path");
const plist = require("plist");
const bplist = require("bplist-parser");

const INPUT_FILE = path.resolve(__dirname, "../../src/parser/ReportDataReal.xlsx .webarchive");

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

function describeValue(name, value, depth = 0) {
  const indent = "  ".repeat(depth);

  if (Buffer.isBuffer(value)) {
    console.log(`${indent}${name}: Buffer(${value.length})`);
    return;
  }

  if (value instanceof Uint8Array) {
    console.log(`${indent}${name}: Uint8Array(${value.length})`);
    return;
  }

  if (Array.isArray(value)) {
    console.log(`${indent}${name}: Array(${value.length})`);
    if (depth < 2) {
      value.slice(0, 5).forEach((item, idx) => {
        describeValue(`[${idx}]`, item, depth + 1);
      });
    }
    return;
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    console.log(`${indent}${name}: Object keys =`, keys);
    if (depth < 2) {
      keys.slice(0, 20).forEach((k) => {
        describeValue(k, value[k], depth + 1);
      });
    }
    return;
  }

  const preview = String(value).slice(0, 200).replace(/\n/g, "\\n");
  console.log(`${indent}${name}: ${typeof value} = ${preview}`);
}

try {
  const parsed = parseWebArchive(INPUT_FILE);
  describeValue("root", parsed);

  console.log("\n=== QUICK CHECK ===");
  console.log("Has WebMainResource:", !!parsed.WebMainResource);
  console.log("Has WebSubresources:", !!parsed.WebSubresources);

  if (parsed.WebMainResource) {
    console.log("WebMainResource keys:", Object.keys(parsed.WebMainResource));
  }

  if (Array.isArray(parsed.WebSubresources)) {
    console.log("WebSubresources count:", parsed.WebSubresources.length);
    parsed.WebSubresources.slice(0, 10).forEach((res, i) => {
      console.log(`Subresource #${i}:`, {
        keys: Object.keys(res || {}),
        url: res?.WebResourceURL,
        mime: res?.WebResourceMIMEType,
        textEncoding: res?.WebResourceTextEncodingName,
        frameName: res?.WebResourceFrameName,
        dataType:
          Buffer.isBuffer(res?.Data)
            ? `Buffer(${res.Data.length})`
            : res?.Data instanceof Uint8Array
            ? `Uint8Array(${res.Data.length})`
            : typeof res?.Data,
      });
    });
  }
} catch (err) {
  console.error("Lỗi:", err.message);
}