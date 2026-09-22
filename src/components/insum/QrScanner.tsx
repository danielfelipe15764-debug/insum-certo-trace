import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Keyboard } from "lucide-react";

interface Props {
  onCodigo: (codigo: string) => void;
  sugestoes?: string[];
}

export function QrScanner({ onCodigo, sugestoes = [] }: Props) {
  const [ativo, setAtivo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const divId = "qr-reader-region";
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);

  useEffect(() => {
    if (!ativo) return;
    let cancelado = false;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode(divId, { verbose: false });
        scannerRef.current = scanner as unknown as { stop: () => Promise<void>; clear: () => void };
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (texto) => {
            if (cancelado) return;
            cancelado = true;
            onCodigo(texto.trim());
            scanner.stop().then(() => scanner.clear()).catch(() => undefined);
            setAtivo(false);
          },
          () => undefined,
        );
      } catch {
        setErro("Não foi possível acessar a câmera. Use a digitação do código abaixo.");
        setAtivo(false);
      }
    })();
    return () => {
      cancelado = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      s?.stop().then(() => s.clear()).catch(() => undefined);
    };
  }, [ativo, onCodigo]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
        <div id={divId} className="min-h-[220px] w-full [&_video]:w-full [&_video]:rounded-2xl" />
        {!ativo && (
          <div className="grid min-h-[220px] place-items-center px-6 py-10 text-center">
            <div>
              <Camera className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aponte a câmera do celular para o QR Code do insumo.
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          setErro(null);
          setAtivo((v) => !v);
        }}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-5 text-lg font-bold text-primary-foreground shadow-card active:scale-[0.99]"
      >
        {ativo ? <CameraOff className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
        {ativo ? "Parar câmera" : "Abrir câmera e ler QR"}
      </button>

      {erro && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{erro}</p>}

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Keyboard className="h-4 w-4" /> Digitar código manualmente
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value.toUpperCase())}
            placeholder="QR-INS-000101"
            maxLength={30}
            className="h-12 flex-1 rounded-xl border border-input bg-background px-4 text-base outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => manual.trim() && onCodigo(manual.trim())}
            className="h-12 rounded-xl bg-secondary px-5 text-base font-semibold text-secondary-foreground"
          >
            Confirmar
          </button>
        </div>
        {sugestoes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {sugestoes.slice(0, 6).map((s) => (
              <button
                key={s}
                onClick={() => onCodigo(s)}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
