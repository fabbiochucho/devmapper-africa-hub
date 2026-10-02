import { useRef, useState } from "react";
import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { errorMessageOf } from "@/lib/error-handler";

export interface AttachedDocument {
  name: string;
  text: string;
}

const TEXT_TYPES = /\.(txt|csv|tsv|md|json)$/i;
const BINARY_TYPES = /\.(pdf|png|jpe?g|webp)$/i;
const MAX_TEXT = 30_000;
const MAX_BYTES = 8 * 1024 * 1024;

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

/** Attach a document to a Ndovu question. Text files are read here; PDFs and images are transcribed server-side. */
export function DocumentAttach({ value, onChange }: { value: AttachedDocument | null; onChange: (d: AttachedDocument | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) return toast.error("File is too large (max 8 MB)");
    setReading(true);
    try {
      let text: string;
      if (TEXT_TYPES.test(file.name)) {
        text = await file.text();
      } else if (BINARY_TYPES.test(file.name)) {
        const { data, error } = await supabase.functions.invoke("extract-document", { body: { dataUrl: await readAsDataUrl(file) } });
        if (error) throw error;
        text = data?.text ?? "";
      } else {
        throw new Error("Use a PDF, image, or text file (txt, csv, md, json)");
      }
      if (!text.trim()) throw new Error("No readable text found");
      if (text.length > MAX_TEXT) toast.info(`Only the first ${MAX_TEXT.toLocaleString()} characters will be used.`);
      onChange({ name: file.name, text: text.slice(0, MAX_TEXT) });
    } catch (e) {
      toast.error("Couldn't read that file", { description: errorMessageOf(e) });
    } finally {
      setReading(false);
      if (input.current) input.current.value = "";
    }
  };

  if (value) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
        <FileText className="h-3.5 w-3.5" />
        {value.name} · {value.text.length.toLocaleString()} characters
        <button type="button" aria-label="Remove document" onClick={() => onChange(null)}><X className="h-3 w-3" /></button>
      </span>
    );
  }
  return (
    <>
      <input ref={input} id="ndovu-document" type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.tsv,.md,.json"
        onChange={(e) => pick(e.target.files?.[0])} />
      <Button type="button" variant="ghost" size="sm" onClick={() => input.current?.click()} disabled={reading}
        title="The document's text is sent to the AI model to answer your question; it is not stored.">
        {reading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Paperclip className="h-4 w-4 mr-1.5" />}
        {reading ? "Reading…" : "Attach document"}
      </Button>
    </>
  );
}
