// The police's number into the phone's contacts, without a file landing in Downloads: on Android the phone app opens
// with the number typed in, one tap from "Create new contact" (Chrome won't open the Contacts editor itself from a web
// page); on an iPhone the contact card (public/police.vcf) opens in Safari's contact sheet, "Create New Contact" (a
// tel: link there would offer to ring instead). Only a computer gets the card as a download. And copying the number,
// for a phone that won't do either.

export const POLICE_NAME = 'Manchester Metropolitan Police';
/** The number to dial. 07700 900000–900999 is kept free for drama, so this rings nobody. */
export const POLICE_TEL = '+447700900417';
/** The same, written the UK way for reading. */
export const POLICE_TEL_SHOWN = '+44 7700 900417';
const FILE_NAME = 'manchester-metropolitan-police.vcf';
const NOTE = 'Answer when we ring.';
/** The same card as policeCard(), as a file, so an iPhone opens it as a contact; keep the two in step. */
const CARD_URL = `${import.meta.env.BASE_URL}police.vcf`;

/** Backslashes, commas, semicolons and newlines need escaping in a vCard text value. */
const esc = (text: string) => text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`);

export function policeCard(note = NOTE) {
  const name = esc(POLICE_NAME);
  // vCard lines end in CRLF, the last one too.
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    `N:;${name};;;`,
    `ORG:${name}`,
    `TEL;TYPE=CELL:${POLICE_TEL}`,
    `NOTE:${esc(note)}`,
    'END:VCARD',
    '',
  ].join('\r\n');
}

/** How the contact went over: the number into the phone app (Android), a card (iPhone), or a file (a computer). */
export type Added = 'dialler' | 'card' | 'file';

/** Adds the police to the phone's contacts, the best way the phone allows. Call it from a tap, or it may be blocked. */
export function addContact(): Added {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) {
    // Opens the dialler with the number in; it doesn't ring until they press call.
    window.location.href = `tel:${POLICE_TEL}`;
    return 'dialler';
  }
  // iPads say they're Macs, but have touch.
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) {
    // In a new tab, so the game stays where it was underneath.
    window.open(CARD_URL, '_blank');
    return 'card';
  }
  saveContact();
  return 'file';
}

/** Downloads the card as a file: what a computer gets. Call it from a tap, or the browser may block it. */
export function saveContact() {
  const url = URL.createObjectURL(new Blob([policeCard()], { type: 'text/vcard;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = FILE_NAME;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  // Safari reads the URL after click() returns, so it goes a little later.
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Copies text: the Clipboard API where there is one (only on https), else a hidden textarea and execCommand, which
 * still works on a phone opening the dev server over plain http. Resolves false if neither worked.
 */
export async function copyText(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* refused (permissions, an iframe): try the old way */
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    // Off screen, and 16px so an iPhone doesn't zoom to it.
    area.style.cssText = 'position:fixed;top:0;left:-9999px;font-size:16px;opacity:0';
    document.body.append(area);
    area.select();
    area.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}
