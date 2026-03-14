
"use client"

import { useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Printer, 
  Download, 
  FileText, 
  ShieldCheck, 
  Stamp, 
  Signature, 
  X,
  CheckCircle2,
  Building2,
  BadgeCheck,
  Scale,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface ReceiptVoucherModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: any
}

export function ReceiptVoucherModal({ open, onOpenChange, transaction }: ReceiptVoucherModalProps) {
  const db = useFirestore()
  
  const docRef = useMemoFirebase(() => db ? doc(db, 'settings', 'documents') : null, [db])
  const { data: docSettings } = useDoc(docRef)

  const firmRef = useMemoFirebase(() => db ? doc(db, 'settings', 'firm') : null, [db])
  const { data: firmData } = useDoc(firmRef)

  const isReceipt = transaction?.type?.includes('Entrada')

  const renderedText = useMemo(() => {
    if (!transaction || !docSettings) return ""
    
    const template = isReceipt ? docSettings.receiptTemplate : docSettings.voucherTemplate
    if (!template) return "Template não configurado nos ajustes."

    const value = Number(transaction.value || 0)
    
    const extenso = "reais" 

    const map: Record<string, string> = {
      "{{NOME_CLIENTE}}": (transaction.clientName || transaction.entityName || "Não Informado").toUpperCase(),
      "{{CLIENTE_CPF}}": transaction.documentNumber || "---",
      "{{VALOR}}": `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      "{{VALOR_EXTENSO}}": extenso,
      "{{DESCRICAO}}": transaction.description || "Referente a serviços jurídicos",
      "{{DATA}}": format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      "{{NUMERO_PROCESSO}}": transaction.processNumber || "N/A"
    }

    let text = template
    Object.entries(map).forEach(([tag, val]) => {
      text = text.replaceAll(tag, val)
    })

    return text
  }, [transaction, docSettings, isReceipt])

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[800px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans flex flex-col h-[90vh]">
        <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between flex-none shadow-xl print:hidden">
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center border shadow-xl",
              isReceipt ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
            )}>
              {isReceipt ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
            </div>
            <div>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">
                {isReceipt ? "Emissão de Recibo" : "Comprovante de Pagamento"}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black text-muted-foreground opacity-50 tracking-widest">
                RGMJ ADVOGADOS • DOCUMENTAÇÃO OFICIAL
              </DialogDescription>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-11 px-6 border-white/10 text-white font-black text-[10px] uppercase rounded-xl gap-2 hover:bg-white/5" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> IMPRIMIR
            </Button>
            <Button className="h-11 px-8 gold-gradient text-background font-black text-[10px] uppercase rounded-xl gap-2 shadow-xl hover:scale-105 transition-all">
              <Download className="h-4 w-4" /> BAIXAR PDF
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 bg-white p-12 md:p-20 overflow-y-auto">
          <div className="max-w-[210mm] mx-auto text-black font-serif space-y-16 print:p-0">
            <div className="flex items-start justify-between border-b-2 border-black pb-8">
              <div className="space-y-2">
                {docSettings?.logoUrl ? (
                  <img src={docSettings.logoUrl} alt="Logo" className="h-16 object-contain" />
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded">
                      <Scale className="h-6 w-6" />
                    </div>
                    <span className="text-2xl font-black uppercase tracking-tighter">{firmData?.name || "RGMJ ADVOGADOS"}</span>
                  </div>
                )}
                <div className="text-[10px] font-sans font-bold uppercase text-black/60 leading-tight">
                  <p>{firmData?.address}, {firmData?.number}</p>
                  <p>{firmData?.city} - {firmData?.state} • CEP {firmData?.zipCode}</p>
                  <p>CNPJ: {firmData?.cnpj} • {firmData?.phone}</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <BadgeCheck className="h-12 w-12 text-black/10 ml-auto" />
                <h2 className="text-3xl font-black uppercase tracking-tighter">{isReceipt ? "RECIBO" : "COMPROVANTE"}</h2>
                <p className="text-xs font-mono font-bold">Nº {transaction?.id?.substring(0,8).toUpperCase()}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="bg-black/5 border-2 border-black p-4 px-8 rounded-lg">
                <span className="text-xs font-sans font-black uppercase block mb-1">Valor Total</span>
                <span className="text-3xl font-black">R$ {Number(transaction?.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="space-y-10 min-h-[200px]">
              <p className="text-lg leading-loose text-justify whitespace-pre-wrap">
                {renderedText}
              </p>
              <p className="text-right font-bold">
                {firmData?.city || "São Paulo"}, {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-20 pt-20">
              <div className="text-center space-y-4">
                <div className="h-[1px] bg-black w-full" />
                <p className="text-[10px] font-sans font-black uppercase whitespace-pre-wrap">
                  {docSettings?.signatureText || "ASSINATURA DO RESPONSÁVEL"}
                </p>
                {docSettings?.useDigitalSignature && (
                  <div className="inline-flex items-center gap-2 text-[8px] font-sans font-black text-emerald-600 border border-emerald-600/30 px-2 py-1 rounded">
                    <ShieldCheck className="h-3 w-3" /> ASSINADO DIGITALMENTE
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="w-32 h-32 border-4 border-black/20 rounded-full flex flex-col items-center justify-center text-center p-4 rotate-12 opacity-60">
                  <Stamp className="h-6 w-6 mb-2" />
                  <p className="text-[8px] font-sans font-black uppercase leading-tight">
                    {docSettings?.stampText || "RGMJ ADVOGADOS\nCARIMBO OFICIAL"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none print:hidden">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Documento Válido via Soberania RGMJ</span>
          </div>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white uppercase font-black text-[11px] px-10 h-12">FECHAR</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
