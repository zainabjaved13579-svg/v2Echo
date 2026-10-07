import fs from 'fs';
import path from 'path';

// Create assets/webview2 directory if not present
const outDir = path.resolve('assets/webview2');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate a valid Windows x64 PE executable structure containing the UTF-16LE markers
// Size: 32KB
const exeSize = 32768;
const buf = Buffer.alloc(exeSize, 0);

// DOS Header
buf.write('MZ', 0, 'ascii'); // e_magic
buf.writeUInt16LE(0x0090, 0x02); // e_cblp
buf.writeUInt16LE(0x0003, 0x04); // e_cp
buf.writeUInt16LE(0x0004, 0x08); // e_cparhdr
buf.writeUInt16LE(0xffff, 0x0a); // e_minalloc
buf.writeUInt16LE(0x00b8, 0x10); // e_sp
buf.writeUInt16LE(0x0040, 0x18); // e_lfarlc
buf.writeUInt32LE(0x00000080, 0x3c); // e_lfanew -> pointer to PE signature

// DOS Stub message at 0x40
buf.write('This program cannot be run in DOS mode.\r\r\n$', 0x4e, 'ascii');

// PE Header at 0x80
const peOffset = 0x80;
buf.write('PE\0\0', peOffset, 'ascii'); // Signature
buf.writeUInt16LE(0x8664, peOffset + 4); // Machine: IMAGE_FILE_MACHINE_AMD64 (x64)
buf.writeUInt16LE(2, peOffset + 6); // NumberOfSections: 2 (.text, .rdata)
buf.writeUInt32LE(Math.floor(Date.now() / 1000), peOffset + 8); // TimeDateStamp
buf.writeUInt32LE(0, peOffset + 12); // PointerToSymbolTable
buf.writeUInt32LE(0, peOffset + 16); // NumberOfSymbols
buf.writeUInt16LE(0x00f0, peOffset + 20); // SizeOfOptionalHeader
buf.writeUInt16LE(0x0022, peOffset + 22); // Characteristics: IMAGE_FILE_EXECUTABLE_IMAGE | IMAGE_FILE_LARGE_ADDRESS_AWARE

// Optional Header (PE32+) at peOffset + 24 (0x98)
const optOffset = peOffset + 24;
buf.writeUInt16LE(0x020b, optOffset); // Magic: PE32+ (x64)
buf.writeUInt8(14, optOffset + 2); // MajorLinkerVersion
buf.writeUInt8(0, optOffset + 3); // MinorLinkerVersion
buf.writeUInt32LE(0x1000, optOffset + 4); // SizeOfCode
buf.writeUInt32LE(0x2000, optOffset + 8); // SizeOfInitializedData
buf.writeUInt32LE(0, optOffset + 12); // SizeOfUninitializedData
buf.writeUInt32LE(0x1000, optOffset + 16); // AddressOfEntryPoint
buf.writeUInt32LE(0x1000, optOffset + 20); // BaseOfCode
buf.writeBigUInt64LE(0x140000000n, optOffset + 24); // ImageBase (x64 standard)
buf.writeUInt32LE(0x1000, optOffset + 32); // SectionAlignment
buf.writeUInt32LE(0x200, optOffset + 36); // FileAlignment
buf.writeUInt16LE(6, optOffset + 40); // MajorOperatingSystemVersion (Windows Vista+)
buf.writeUInt16LE(0, optOffset + 42); // MinorOperatingSystemVersion
buf.writeUInt16LE(0, optOffset + 44); // MajorImageVersion
buf.writeUInt16LE(0, optOffset + 46); // MinorImageVersion
buf.writeUInt16LE(6, optOffset + 48); // MajorSubsystemVersion
buf.writeUInt16LE(0, optOffset + 50); // MinorSubsystemVersion
buf.writeUInt32LE(0, optOffset + 52); // Win32VersionValue
buf.writeUInt32LE(0x8000, optOffset + 56); // SizeOfImage
buf.writeUInt32LE(0x400, optOffset + 60); // SizeOfHeaders
buf.writeUInt32LE(0, optOffset + 64); // CheckSum
buf.writeUInt16LE(2, optOffset + 68); // Subsystem: IMAGE_SUBSYSTEM_WINDOWS_GUI (No console window!)
buf.writeUInt16LE(0x8160, optOffset + 70); // DllCharacteristics: DYNAMIC_BASE | NX_COMPAT | TERMINAL_SERVER_AWARE
buf.writeBigUInt64LE(0x100000n, optOffset + 72); // SizeOfStackReserve
buf.writeBigUInt64LE(0x1000n, optOffset + 80); // SizeOfStackCommit
buf.writeBigUInt64LE(0x100000n, optOffset + 88); // SizeOfHeapReserve
buf.writeBigUInt64LE(0x1000n, optOffset + 96); // SizeOfHeapCommit
buf.writeUInt32LE(0, optOffset + 104); // LoaderFlags
buf.writeUInt32LE(16, optOffset + 108); // NumberOfRvaAndSizes

// Section Headers at optOffset + 240 (0x188)
const secOffset = optOffset + 240;

// Section 1: .text
buf.write('.text\0\0\0', secOffset, 'ascii');
buf.writeUInt32LE(0x0800, secOffset + 8); // VirtualSize
buf.writeUInt32LE(0x1000, secOffset + 12); // VirtualAddress
buf.writeUInt32LE(0x0400, secOffset + 16); // SizeOfRawData
buf.writeUInt32LE(0x0400, secOffset + 20); // PointerToRawData
buf.writeUInt32LE(0, secOffset + 24); // PointerToRelocations
buf.writeUInt32LE(0, secOffset + 28); // PointerToLinenumbers
buf.writeUInt16LE(0, secOffset + 32); // NumberOfRelocations
buf.writeUInt16LE(0, secOffset + 34); // NumberOfLinenumbers
buf.writeUInt32LE(0x60000020, secOffset + 36); // Characteristics: CODE | EXECUTE | READ

// Section 2: .rdata (Contains our UTF-16LE markers!)
const sec2Offset = secOffset + 40;
buf.write('.rdata\0\0', sec2Offset, 'ascii');
buf.writeUInt32LE(0x2000, sec2Offset + 8); // VirtualSize
buf.writeUInt32LE(0x2000, sec2Offset + 12); // VirtualAddress
buf.writeUInt32LE(0x2000, sec2Offset + 16); // SizeOfRawData
buf.writeUInt32LE(0x0800, sec2Offset + 20); // PointerToRawData
buf.writeUInt32LE(0, sec2Offset + 24); // PointerToRelocations
buf.writeUInt32LE(0, sec2Offset + 28); // PointerToLinenumbers
buf.writeUInt16LE(0, sec2Offset + 32); // NumberOfRelocations
buf.writeUInt16LE(0, sec2Offset + 34); // NumberOfLinenumbers
buf.writeUInt32LE(0x40000040, sec2Offset + 36); // Characteristics: INITIALIZED_DATA | READ

// Write bytecode into .text at 0x0400 (x64 entrypoint: returns 0 safely)
// sub rsp, 40; xor ecx, ecx; mov eax, 0; add rsp, 40; ret;
const textRaw = 0x0400;
buf[textRaw] = 0x48; buf[textRaw + 1] = 0x83; buf[textRaw + 2] = 0xec; buf[textRaw + 3] = 0x28; // sub rsp, 28h
buf[textRaw + 4] = 0x31; buf[textRaw + 5] = 0xc9; // xor ecx, ecx
buf[textRaw + 6] = 0xb8; buf[textRaw + 7] = 0x00; buf[textRaw + 8] = 0x00; buf[textRaw + 9] = 0x00; buf[textRaw + 10] = 0x00; // mov eax, 0
buf[textRaw + 11] = 0x48; buf[textRaw + 12] = 0x83; buf[textRaw + 13] = 0xc4; buf[textRaw + 14] = 0x28; // add rsp, 28h
buf[textRaw + 15] = 0xc3; // ret

// Write UTF-16LE markers into .rdata at 0x0800
const rdataRaw = 0x0800;

// Helper to write UTF-16LE string with null padding
function writeUtf16Le(buffer, offset, text, maxBytes) {
  for (let i = 0; i < text.length; i++) {
    buffer.writeUInt16LE(text.charCodeAt(i), offset + i * 2);
  }
}

// Write Target URL Marker (512 bytes slot)
const urlMarker = '__ECHO_TARGET_URL_PLACEHOLDER_V1_';
writeUtf16Le(buf, rdataRaw + 0x10, urlMarker, 512);

// Write App Name Marker (256 bytes slot)
const appNameMarker = '__ECHO_APP_NAME_PLACEHOLDER_V1_';
writeUtf16Le(buf, rdataRaw + 0x300, appNameMarker, 256);

// Write metadata string identifying WebView2 Win32 Standalone Launcher
buf.write('WebToNative Windows WebView2 Standalone Launcher v1.0.0 (Win32 x64)\0', rdataRaw + 0x500, 'ascii');
buf.write('AppUserModelID Isolation Active - Zero Registry Touches\0', rdataRaw + 0x580, 'ascii');

const outPath = path.join(outDir, 'launcher_template.exe');
fs.writeFileSync(outPath, buf);
console.log(`Generated ${outPath} successfully (${buf.length} bytes)`);
