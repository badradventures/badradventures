declare module "mailparser" {
  export interface ParsedAddress {
    name?: string;
    address?: string;
  }
  export interface AddressObject {
    value: ParsedAddress[];
    text: string;
  }
  export interface Attachment {
    filename?: string;
    contentType?: string;
    size?: number;
    content?: Buffer;
    cid?: string;
  }
  export interface ParsedMail {
    from?: AddressObject;
    to?: AddressObject | AddressObject[];
    cc?: AddressObject | AddressObject[];
    bcc?: AddressObject | AddressObject[];
    subject?: string;
    date?: Date;
    messageId?: string;
    inReplyTo?: string;
    references?: string | string[];
    text?: string;
    html?: string | false;
    headers?: Map<string, string | string[]>;
    attachments?: Attachment[];
  }
  export function simpleParser(source: Buffer | string | Uint8Array): Promise<ParsedMail>;
  export type AddressObject = AddressObject;
  export type ParsedMail = ParsedMail;
}
