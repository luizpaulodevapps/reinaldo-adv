
"use client"

import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Edit3, 
  Eye,
  Star, 
  DollarSign, 
  MessageSquare, 
  Megaphone, 
  Shield, 
  ChevronRight,
  ListPlus,
  Type,
  Hash,
  ToggleLeft,
  X,
  Scale,
  FileEdit,
  ShieldCheck,
  LayoutGrid,
  Circle,
  FileText,
  AlertCircle,
  Gavel,
  CheckCircle2,
  PlusCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, where } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const CATEGORIES = [
  { id: "Entrevista de Triagem", label: "Entrevista de Triagem", icon: MessageSquare },
  { id: "Operacional", label: "Operacional", icon: Star },
  { id: "Financeiro", label: "Financeiro", icon: DollarSign },
  { id: "Comercial", label: "Comercial", icon: Megaphone },
  { id: "Gestão", label: "Gestão", icon: Shield },
]

const LEGAL_AREAS = [
  "Trabalhista",
  "Cível",
  "Criminal",
  "Previdenciário",
  "Tributário",
  "Família",
  "Empresarial",
  "Geral"
]

const FIELD_TYPES = [
  { id: "boolean", label: "Sim / Não", icon: ToggleLeft },
  { id: "boolean_partial", label: "Sim / Não / Parcial", icon: Circle },
  { id: "text", label: "Resposta em Texto", icon: FileText },
  { id: "number", label: "Valor Numérico", icon: Hash },
]

const REUSE_TARGETS = [
  { id: "caseDetails", label: "Detalhes do Caso" },
  { id: "distribution", label: "Distribuição" },
  { id: "client", label: "Cadastro do Cliente" },
  { id: "claimant", label: "Cadastro do Reclamante" },
]

const REUSE_PRIORITIES = [
  { id: "alta", label: "Alta" },
  { id: "media", label: "Média" },
  { id: "baixa", label: "Baixa" },
]

const TARGET_FIELDS_BY_REUSE_TARGET: Record<string, Array<{ id: string; label: string }>> = {
  caseDetails: [
    { id: "caseDetails", label: "Detalhes do Caso" },
  ],
  distribution: [
    { id: "processTitle", label: "Título do Processo" },
    { id: "processNumber", label: "Número CNJ" },
    { id: "link", label: "Link CNJ" },
    { id: "forum", label: "Tribunal/Fórum" },
    { id: "vara", label: "Vara" },
    { id: "hearingDate", label: "Data da Audiência" },
  ],
  client: [
    { id: "fullName", label: "Nome Completo" },
    { id: "cpf", label: "CPF" },
    { id: "rg", label: "RG" },
    { id: "rgIssueDate", label: "Data Expedição RG" },
    { id: "motherName", label: "Nome da Mãe" },
    { id: "ctps", label: "CTPS" },
    { id: "zipCode", label: "CEP" },
    { id: "address", label: "Endereço" },
    { id: "neighborhood", label: "Bairro" },
    { id: "city", label: "Cidade" },
    { id: "state", label: "UF" },
  ],
  claimant: [
    { id: "fullName", label: "Nome Completo" },
    { id: "documentNumber", label: "CPF/CNPJ" },
    { id: "documentType", label: "Tipo Documento" },
    { id: "zipCode", label: "CEP" },
    { id: "address", label: "Endereço" },
    { id: "neighborhood", label: "Bairro" },
    { id: "city", label: "Cidade" },
    { id: "state", label: "UF" },
  ],
}

const MIN_QUESTIONS_REQUIRED = 1

type ReadyQuestionTemplate = {
  id: string
  label: string
  type: string
  required?: boolean
  reuseEnabled?: boolean
  reuseTarget?: string
  targetField?: string
  reusePriority?: string
  balizaObrigatoria?: boolean
}

const READY_QUESTION_TEMPLATES: ReadyQuestionTemplate[] = [
  { id: "id-nome", label: "IDENTIFICACAO: NOME COMPLETO", type: "text", required: true, reuseEnabled: true, reuseTarget: "client", targetField: "fullName", reusePriority: "alta", balizaObrigatoria: true },
  { id: "id-cpf", label: "IDENTIFICACAO: CPF", type: "text", required: true, reuseEnabled: true, reuseTarget: "client", targetField: "cpf", reusePriority: "alta", balizaObrigatoria: true },
  { id: "id-rg", label: "IDENTIFICACAO: RG", type: "text", required: false, reuseEnabled: true, reuseTarget: "client", targetField: "rg", reusePriority: "media" },
  { id: "id-estado-profissao", label: "IDENTIFICACAO: ESTADO CIVIL E PROFISSAO ATUAL", type: "text", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "baixa" },
  { id: "id-endereco", label: "IDENTIFICACAO: ENDERECO COMPLETO", type: "text", required: true, reuseEnabled: true, reuseTarget: "client", targetField: "address", reusePriority: "media" },
  { id: "id-contato", label: "IDENTIFICACAO: TELEFONE, WHATSAPP E EMAIL", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },

  { id: "empresa-nome", label: "EMPRESA: NOME DA EMPRESA", type: "text", required: true, reuseEnabled: true, reuseTarget: "claimant", targetField: "fullName", reusePriority: "alta", balizaObrigatoria: true },
  { id: "empresa-cnpj", label: "EMPRESA: CNPJ (SE SOUBER)", type: "text", required: false, reuseEnabled: true, reuseTarget: "claimant", targetField: "documentNumber", reusePriority: "media" },
  { id: "empresa-endereco", label: "EMPRESA: ENDERECO DA EMPRESA", type: "text", required: false, reuseEnabled: true, reuseTarget: "claimant", targetField: "address", reusePriority: "media" },
  { id: "empresa-responsavel", label: "EMPRESA: RESPONSAVEL DIRETO (GERENTE/SUPERVISOR)", type: "text", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },
  { id: "empresa-ativa", label: "EMPRESA: AINDA ESTA ATIVA?", type: "boolean_partial", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "baixa" },

  { id: "contrato-admissao", label: "CONTRATO: DATA DE ADMISSAO", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta", balizaObrigatoria: true },
  { id: "contrato-demissao", label: "CONTRATO: DATA DE DEMISSAO OU SE AINDA TRABALHA", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "contrato-tipo-demissao", label: "CONTRATO: TIPO DE DEMISSAO (SEM JUSTA CAUSA/JUSTA CAUSA/PEDIDO/INDIRETA)", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "contrato-cargo", label: "CONTRATO: CARGO REGISTRADO X CARGO REAL", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },
  { id: "contrato-salario", label: "CONTRATO: SALARIO REGISTRADO", type: "number", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "contrato-por-fora", label: "CONTRATO: RECEBIA POR FORA OU HOUVE AUMENTO NAO REGISTRADO?", type: "text", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },

  { id: "jornada-horario", label: "JORNADA: HORARIO DE ENTRADA, SAIDA E INTERVALO", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "jornada-fim-semana", label: "JORNADA: TRABALHAVA AOS SABADOS/DOMINGOS?", type: "boolean_partial", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },
  { id: "jornada-horas-extras", label: "JORNADA: HORAS EXTRAS (QUANTIDADE E PAGAMENTO)", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "jornada-banco-ponto", label: "JORNADA: BANCO DE HORAS E CONTROLE DE PONTO", type: "boolean_partial", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },

  { id: "verbas-ferias", label: "VERBAS: RECEBEU FERIAS + 1/3?", type: "boolean", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "verbas-decimo", label: "VERBAS: RECEBEU 13 SALARIO?", type: "boolean", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "verbas-fgts", label: "VERBAS: RECEBEU FGTS E MULTA DE 40%?", type: "boolean_partial", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "verbas-aviso-seguro", label: "VERBAS: RECEBEU AVISO PREVIO E SEGURO-DESEMPREGO?", type: "boolean_partial", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "docs-trct", label: "DOCUMENTOS: POSSUI TRCT?", type: "boolean", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },
  { id: "docs-fgts", label: "DOCUMENTOS: POSSUI CHAVE E EXTRATO DO FGTS?", type: "boolean_partial", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },
  { id: "docs-comprovantes", label: "DOCUMENTOS: POSSUI COMPROVANTES DE PAGAMENTO?", type: "boolean", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },

  { id: "especifico-desvio", label: "SITUACOES ESPECIFICAS: HOUVE DESVIO OU ACUMULO DE FUNCAO?", type: "boolean_partial", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "especifico-insalubridade", label: "SITUACOES ESPECIFICAS: INSALUBRIDADE/PERICULOSIDADE E ADICIONAL", type: "text", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },
  { id: "especifico-assedio", label: "SITUACOES ESPECIFICAS: ASSEDIO MORAL, TESTEMUNHAS E PROVAS", type: "text", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "especifico-acidente", label: "SITUACOES ESPECIFICAS: ACIDENTE, CAT E AUXILIO-DOENCA", type: "text", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },
  { id: "especifico-estabilidade", label: "SITUACOES ESPECIFICAS: ESTABILIDADE (GESTANTE/CIPA/DOENCA/SINDICAL)", type: "boolean_partial", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },

  { id: "provas-gerais", label: "PROVAS: CTPS, HOLERITES, EXTRATO FGTS, WHATSAPP, FOTOS, CONTRATO, ADVERTENCIAS", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "testemunhas", label: "TESTEMUNHAS: NOME, TELEFONE, SE AINDA TRABALHAM E O QUE SABEM", type: "text", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },
  { id: "situacao-atual", label: "SITUACAO ATUAL: DESEMPREGADO, RESCISAO, INFORMALIDADE E URGENCIA FINANCEIRA", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta", balizaObrigatoria: true },
  { id: "expectativa-cliente", label: "EXPECTATIVA DO CLIENTE: OBJETIVO, PRAZO E ACEITE DE ACORDO", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "avaliacao-interna", label: "AVALIACAO JURIDICA INTERNA: VIAVEL/RISCO/PROVAS/ACORDO/VALOR", type: "text", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },
  { id: "formalizacao", label: "FORMALIZACAO DO LEAD: HONORARIOS, CUSTAS, PERICIA E ASSINATURAS", type: "text", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },
  { id: "pergunta-final", label: "PERGUNTA FINAL: EXISTE ALGO A MAIS QUE TE INCOMODAVA E AINDA NAO COMENTOU?", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta", balizaObrigatoria: true },
]

const READY_TEMPLATE_STARTER_PACK = [
  "id-nome",
  "id-cpf",
  "contrato-tipo-demissao",
  "jornada-horas-extras",
  "provas-gerais",
  "pergunta-final",
]

const READY_TEMPLATE_BASE_PACK = READY_QUESTION_TEMPLATES.map((template) => template.id)

const DEFAULT_CHECKLIST_TITLE = "CHECKLIST - ENTREVISTA PARA PROCESSO TRABALHISTA"
const DEFAULT_CHECKLIST_DESCRIPTION = "Padrao basico trabalhista para triagem. Voce pode editar, remover e adicionar perguntas a qualquer momento."

const READY_QUESTION_TEMPLATES_EXTRA: ReadyQuestionTemplate[] = [
  { id: "civel-conflito", label: "CIVEL: QUAL E O CONFLITO?", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta", balizaObrigatoria: true },
  { id: "civel-inicio", label: "CIVEL: QUANDO O CONFLITO COMECOU?", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "civel-amigavel", label: "CIVEL: JA TENTOU RESOLVER AMIGAVELMENTE?", type: "boolean_partial", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },
  { id: "civel-contrato", label: "CIVEL: EXISTE CONTRATO?", type: "boolean_partial", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },
  { id: "civel-documentos", label: "CIVEL: POSSUI CONTRATO, PAGAMENTOS, MENSAGENS, NOTIFICACOES OU BOLETIM?", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "civel-pontos", label: "CIVEL: EXISTE DANO MORAL, PROVA DOCUMENTAL OU TESTEMUNHAS?", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },

  { id: "criminal-preso", label: "CRIMINAL: FOI PRESO?", type: "boolean_partial", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta", balizaObrigatoria: true },
  { id: "criminal-flagrante", label: "CRIMINAL: FOI EM FLAGRANTE?", type: "boolean_partial", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "criminal-custodia", label: "CRIMINAL: JA HOUVE AUDIENCIA DE CUSTODIA?", type: "boolean_partial", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "criminal-liberdade", label: "CRIMINAL: RESPONDE EM LIBERDADE?", type: "boolean_partial", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "criminal-acusacao", label: "CRIMINAL: QUAL A ACUSACAO E A DATA DO FATO?", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta", balizaObrigatoria: true },
  { id: "criminal-provas", label: "CRIMINAL: TESTEMUNHAS E PROVAS CONTRA ELE", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "criminal-documentos", label: "CRIMINAL: POSSUI INQUERITO, BO, PROCESSO OU MANDADO?", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },

  { id: "prev-beneficio", label: "PREVIDENCIARIO: TIPO DE BENEFICIO (APOSENTADORIA/AUXILIO/BPC/PENSAO)", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta", balizaObrigatoria: true },
  { id: "prev-historico", label: "PREVIDENCIARIO: TRABALHOU REGISTRADO OU CONTRIBUIU COMO AUTONOMO?", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "prev-cnis", label: "PREVIDENCIARIO: TEM CNIS?", type: "boolean_partial", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },
  { id: "prev-documentos", label: "PREVIDENCIARIO: POSSUI RG/CPF, CTPS, CNIS E LAUDOS MEDICOS?", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },

  { id: "trib-problema", label: "TRIBUTARIO: PROBLEMA (DIVIDA ATIVA/EXECUCAO/MULTA/PLANEJAMENTO)", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta", balizaObrigatoria: true },
  { id: "trib-dados", label: "TRIBUTARIO: CNPJ/CPF, TIPO DE EMPRESA, REGIME E PARCELAMENTO", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "trib-documentos", label: "TRIBUTARIO: POSSUI CDA, AUTOS DE INFRACAO E NOTIFICACOES?", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },

  { id: "familia-acao", label: "FAMILIA: TIPO DE ACAO (DIVORCIO/GUARDA/PENSAO/VISITAS)", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta", balizaObrigatoria: true },
  { id: "familia-filhos", label: "FAMILIA: FILHOS, IDADES E ACORDO PREVIO", type: "text", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },
  { id: "familia-violencia", label: "FAMILIA: EXISTE VIOLENCIA ENVOLVIDA?", type: "boolean_partial", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "familia-documentos", label: "FAMILIA: POSSUI CERTIDOES E COMPROVANTES DE RENDA?", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },

  { id: "empresarial-problema", label: "EMPRESARIAL: NATUREZA DO PROBLEMA (SOCIETARIO/CONTRATO/COBRANCA/RECUPERACAO)", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta", balizaObrigatoria: true },
  { id: "empresarial-dados", label: "EMPRESARIAL: CONTRATO SOCIAL, ALTERACOES, FATURAMENTO E DIVIDAS", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },

  { id: "geral-area", label: "TRIAGEM GERAL: QUAL AREA DO DIREITO?", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta", balizaObrigatoria: true },
  { id: "geral-descricao", label: "TRIAGEM GERAL: BREVE DESCRICAO DO PROBLEMA", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "geral-urgencia", label: "TRIAGEM GERAL: EXISTE URGENCIA?", type: "boolean_partial", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "geral-processo", label: "TRIAGEM GERAL: JA EXISTE PROCESSO?", type: "boolean_partial", required: false, reuseEnabled: true, reuseTarget: "distribution", targetField: "processNumber", reusePriority: "media" },
  { id: "geral-documentos", label: "TRIAGEM GERAL: PODE ENVIAR DOCUMENTOS?", type: "boolean_partial", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "media" },
]

const READY_TEMPLATE_CIVEL_PACK = ["civel-conflito", "civel-inicio", "civel-amigavel", "civel-contrato", "civel-documentos", "civel-pontos"]
const READY_TEMPLATE_CRIMINAL_PACK = ["criminal-preso", "criminal-flagrante", "criminal-custodia", "criminal-liberdade", "criminal-acusacao", "criminal-provas", "criminal-documentos"]
const READY_TEMPLATE_PREVIDENCIARIO_PACK = ["prev-beneficio", "prev-historico", "prev-cnis", "prev-documentos"]
const READY_TEMPLATE_TRIBUTARIO_PACK = ["trib-problema", "trib-dados", "trib-documentos"]
const READY_TEMPLATE_FAMILIA_PACK = ["familia-acao", "familia-filhos", "familia-violencia", "familia-documentos"]
const READY_TEMPLATE_EMPRESARIAL_PACK = ["empresarial-problema", "empresarial-dados"]
const READY_TEMPLATE_GERAL_PACK = ["geral-area", "geral-descricao", "geral-urgencia", "geral-processo", "geral-documentos"]

const ALL_READY_QUESTION_TEMPLATES: ReadyQuestionTemplate[] = [
  ...READY_QUESTION_TEMPLATES,
  ...READY_QUESTION_TEMPLATES_EXTRA,
]

const CHECKLIST_PRESETS_BY_LEGAL_AREA: Record<string, { title: string; description: string; templateIds: string[] }> = {
  "Trabalhista": {
    title: DEFAULT_CHECKLIST_TITLE,
    description: DEFAULT_CHECKLIST_DESCRIPTION,
    templateIds: READY_TEMPLATE_BASE_PACK,
  },
  "Cível": {
    title: "CHECKLIST - ENTREVISTA CIVEL",
    description: "Padrao civil para conflitos contratuais e obrigacionais.",
    templateIds: READY_TEMPLATE_CIVEL_PACK,
  },
  "Criminal": {
    title: "CHECKLIST - ENTREVISTA CRIMINAL",
    description: "Padrao criminal para coleta tecnica inicial do caso.",
    templateIds: READY_TEMPLATE_CRIMINAL_PACK,
  },
  "Previdenciário": {
    title: "CHECKLIST - ENTREVISTA PREVIDENCIARIA",
    description: "Padrao previdenciario para beneficios e historico contributivo.",
    templateIds: READY_TEMPLATE_PREVIDENCIARIO_PACK,
  },
  "Tributário": {
    title: "CHECKLIST - ENTREVISTA TRIBUTARIA",
    description: "Padrao tributario para passivo fiscal e planejamento.",
    templateIds: READY_TEMPLATE_TRIBUTARIO_PACK,
  },
  "Família": {
    title: "CHECKLIST - ENTREVISTA FAMILIA",
    description: "Padrao familia para divorcio, guarda, pensao e visitas.",
    templateIds: READY_TEMPLATE_FAMILIA_PACK,
  },
  "Empresarial": {
    title: "CHECKLIST - ENTREVISTA EMPRESARIAL",
    description: "Padrao empresarial para demandas societarias e contratuais.",
    templateIds: READY_TEMPLATE_EMPRESARIAL_PACK,
  },
  "Geral": {
    title: "CHECKLIST - TRIAGEM GERAL",
    description: "Triagem inicial rapida para direcionar o lead para a area correta.",
    templateIds: READY_TEMPLATE_GERAL_PACK,
  },
}

const normalizeTemplateLabel = (value: string) => value.trim().toUpperCase()

const buildChecklistItemFromTemplate = (template: ReadyQuestionTemplate) => {
  const reuseTarget = template.reuseTarget || "caseDetails"
  const availableFields = TARGET_FIELDS_BY_REUSE_TARGET[reuseTarget] || []
  const fallbackField = availableFields[0]?.id || "caseDetails"
  const targetField = availableFields.some((field) => field.id === template.targetField)
    ? template.targetField
    : fallbackField

  return {
    label: normalizeTemplateLabel(template.label),
    type: template.type || "text",
    required: template.required ?? true,
    reuseEnabled: template.reuseEnabled ?? false,
    reuseTarget,
    targetField,
    reusePriority: template.reusePriority || "media",
    balizaObrigatoria: template.balizaObrigatoria ?? false,
  }
}

const buildChecklistItemsFromTemplateIds = (templateIds: string[]) => {
  const templateIdSet = new Set(templateIds)
  return ALL_READY_QUESTION_TEMPLATES
    .filter((template) => templateIdSet.has(template.id))
    .map(buildChecklistItemFromTemplate)
}

type EditorStep = "geral" | "perguntas" | "revisao"

const EDITOR_STEPS: Array<{ id: EditorStep; label: string }> = [
  { id: "geral", label: "GERAL" },
  { id: "perguntas", label: "PERGUNTAS" },
  { id: "revisao", label: "REVISÃO" },
]

export default function LaboratorioChecklistsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingList, setViewingList] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingList, setEditingList] = useState<any>(null)
  const [editorStep, setEditorStep] = useState<EditorStep>("geral")
  const [isAreaChangeDialogOpen, setIsAreaChangeDialogOpen] = useState(false)
  const [pendingAreaChange, setPendingAreaChange] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Entrevista de Triagem")
  const [legalArea, setLegalArea] = useState("Trabalhista")
  const [description, setDescription] = useState("")
  const [items, setItems] = useState<any[]>([])

  const db = useFirestore()
  const { user, role } = useUser()
  const { toast } = useToast()

  const canManage = role === 'admin'

  const checklistsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "checklists"), orderBy("createdAt", "desc"))
  }, [db, user])

  const { data: checklists, isLoading } = useCollection(checklistsQuery)

  const filteredChecklists = useMemo(() => {
    if (!checklists) return []
    return checklists.filter(c => 
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.legalArea?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [checklists, searchTerm])

  const currentStepIndex = EDITOR_STEPS.findIndex(step => step.id === editorStep)
  const canGoBack = currentStepIndex > 0
  const isLastStep = currentStepIndex === EDITOR_STEPS.length - 1
  const selectedAreaPreset = CHECKLIST_PRESETS_BY_LEGAL_AREA[legalArea] || CHECKLIST_PRESETS_BY_LEGAL_AREA["Trabalhista"]
  const pendingAreaPreset = pendingAreaChange
    ? (CHECKLIST_PRESETS_BY_LEGAL_AREA[pendingAreaChange] || CHECKLIST_PRESETS_BY_LEGAL_AREA["Trabalhista"])
    : null
  const currentQuestionsCount = items.length
  const pendingAreaQuestionsCount = pendingAreaPreset?.templateIds.length || 0
  const templateById = useMemo(() => {
    const templates = new Map<string, ReadyQuestionTemplate>()
    for (const template of ALL_READY_QUESTION_TEMPLATES) {
      templates.set(template.id, template)
    }
    return templates
  }, [])
  const pendingAreaPreviewQuestions = useMemo(() => {
    if (!pendingAreaPreset) return []
    return pendingAreaPreset.templateIds
      .slice(0, 3)
      .map((templateId) => templateById.get(templateId))
      .filter((template): template is ReadyQuestionTemplate => Boolean(template))
  }, [pendingAreaPreset, templateById])
  const pendingAreaPreviewBalizasCount = pendingAreaPreviewQuestions.filter((question) => Boolean(question.balizaObrigatoria)).length
  const selectedAreaTemplates = useMemo(() => {
    const templateIdSet = new Set(selectedAreaPreset?.templateIds || READY_TEMPLATE_BASE_PACK)
    return ALL_READY_QUESTION_TEMPLATES.filter((template) => templateIdSet.has(template.id))
  }, [selectedAreaPreset])

  const applyChecklistPreset = (area: string, mode: "replace" | "append" = "replace") => {
    const preset = CHECKLIST_PRESETS_BY_LEGAL_AREA[area]
    if (!preset) return

    const presetItems = buildChecklistItemsFromTemplateIds(preset.templateIds)

    if (mode === "replace") {
      setTitle(preset.title)
      setCategory("Entrevista de Triagem")
      setLegalArea(area)
      setDescription(preset.description)
      setItems(presetItems)
      toast({
        title: `Padrao ${area.toUpperCase()} aplicado`,
        description: `${preset.templateIds.length} perguntas carregadas como base.`,
      })
      return
    }

    const existingLabels = new Set(items.map((item) => normalizeTemplateLabel(item.label || "")))
    const entriesToAdd = presetItems.filter((entry) => !existingLabels.has(entry.label))

    if (entriesToAdd.length === 0) {
      toast({
        title: "Pacote ja aplicado",
        description: `O pacote ${area.toUpperCase()} ja esta refletido no checklist atual.`,
      })
      return
    }

    setItems((prev) => [...prev, ...entriesToAdd])
    toast({
      title: `Pacote ${area.toUpperCase()} adicionado`,
      description: `${entriesToAdd.length} pergunta(s) incorporada(s).`,
    })
  }

  const handleOpenCreate = () => {
    const preset = CHECKLIST_PRESETS_BY_LEGAL_AREA["Trabalhista"]
    setEditingList(null)
    setTitle(preset.title)
    setCategory("Entrevista de Triagem")
    setLegalArea("Trabalhista")
    setDescription(preset.description)
    setItems(buildChecklistItemsFromTemplateIds(preset.templateIds))
    setEditorStep("geral")
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (list: any) => {
    setEditingList(list)
    setTitle(list.title)
    setCategory(list.category)
    setLegalArea(list.legalArea || "Trabalhista")
    setDescription(list.description || "")
    setItems(list.items || [])
    setEditorStep("geral")
    setIsDialogOpen(true)
  }

  const handleOpenView = (list: any) => {
    setViewingList(list)
    setIsViewDialogOpen(true)
  }

  const handleAddField = () => {
    setItems([
      ...items,
      {
        label: "",
        type: "boolean",
        required: true,
        reuseEnabled: false,
        reuseTarget: "caseDetails",
        targetField: "caseDetails",
        reusePriority: "media",
        balizaObrigatoria: false,
      },
    ])
  }

  const handleAddReadyQuestions = (templates: ReadyQuestionTemplate[]) => {
    if (templates.length === 0) return

    const existingLabels = new Set(items.map((item) => normalizeTemplateLabel(item.label || "")))
    const entriesToAdd = templates
      .map(buildChecklistItemFromTemplate)
      .filter((entry) => !existingLabels.has(entry.label))

    if (entriesToAdd.length === 0) {
      toast({
        title: "Perguntas ja adicionadas",
        description: "As perguntas selecionadas ja estao no checklist.",
      })
      return
    }

    setItems((prev) => [...prev, ...entriesToAdd])
    toast({
      title: "Perguntas adicionadas",
      description: `${entriesToAdd.length} item(ns) incluido(s).`,
    })
  }

  const handleAddReadyQuestionById = (templateId: string) => {
    const template = ALL_READY_QUESTION_TEMPLATES.find((entry) => entry.id === templateId)
    if (!template) return
    handleAddReadyQuestions([template])
  }

  const handleAddStarterPack = () => {
    const starterTemplates = ALL_READY_QUESTION_TEMPLATES.filter((template) =>
      READY_TEMPLATE_STARTER_PACK.includes(template.id)
    )
    handleAddReadyQuestions(starterTemplates)
  }

  const handleApplyDefaultChecklist = (area?: string) => {
    applyChecklistPreset(area || legalArea || "Trabalhista", "replace")
  }

  const handleAddAreaPack = (area?: string) => {
    applyChecklistPreset(area || legalArea || "Trabalhista", "append")
  }

  const handleLegalAreaChange = (nextArea: string) => {
    if (nextArea === legalArea) return

    const hasExistingDraft = items.length > 0 || Boolean(title.trim()) || Boolean(description.trim())
    if (!hasExistingDraft) {
      handleApplyDefaultChecklist(nextArea)
      return
    }

    setPendingAreaChange(nextArea)
    setIsAreaChangeDialogOpen(true)
  }

  const handleConfirmAreaChange = () => {
    if (!pendingAreaChange) {
      setIsAreaChangeDialogOpen(false)
      return
    }

    handleApplyDefaultChecklist(pendingAreaChange)
    setPendingAreaChange(null)
    setIsAreaChangeDialogOpen(false)
  }

  const handleCancelAreaChange = () => {
    setPendingAreaChange(null)
    setIsAreaChangeDialogOpen(false)
  }

  const handleUpdateField = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleRemoveField = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!title || !db) {
      toast({ variant: "destructive", title: "Dados Incompletos" })
      return
    }

    const listData = {
      title: title.toUpperCase(),
      category,
      legalArea,
      description,
      items,
      updatedAt: serverTimestamp()
    }

    if (editingList) {
      updateDocumentNonBlocking(doc(db, "checklists", editingList.id), listData)
      toast({ title: "Matriz Atualizada" })
    } else {
      addDocumentNonBlocking(collection(db, "checklists"), {
        ...listData,
        createdAt: serverTimestamp()
      })
      toast({ title: "Nova Matriz Criada" })
    }
    setIsDialogOpen(false)
  }

  const handleNextStep = () => {
    if (editorStep === "geral" && !title.trim()) {
      toast({ variant: "destructive", title: "Título Necessário" })
      return
    }

    if (editorStep === "perguntas" && items.length < MIN_QUESTIONS_REQUIRED) {
      toast({ variant: "destructive", title: "Adicione ao menos uma pergunta" })
      return
    }

    const nextStep = EDITOR_STEPS[currentStepIndex + 1]
    if (nextStep) {
      setEditorStep(nextStep.id)
    }
  }

  const handlePreviousStep = () => {
    const previousStep = EDITOR_STEPS[currentStepIndex - 1]
    if (previousStep) {
      setEditorStep(previousStep.id)
    }
  }

  if (!canManage && !isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6 font-sans">
        <Shield className="h-16 w-16 text-destructive animate-pulse" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Acesso Negado</h2>
        <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">O Laboratório é restrito à alta cúpula RGMJ.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Laboratório de Matrizes</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-black opacity-60">
            Arquitetura Jurídica: Configure roteiros de triagem e entrevistas.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-64 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filtrar matrizes..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleOpenCreate}
            className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="h-6 w-6 text-[#0a0f1e]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Sincronizando Laboratório...</span>
          </div>
        ) : filteredChecklists.map((list) => {
          const CatIcon = CATEGORIES.find(c => c.id === list.category)?.icon || Star
          return (
            <Card key={list.id} className="glass border-primary/10 hover-gold transition-all group overflow-hidden flex flex-col">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="text-[9px] uppercase font-black border-primary/30 text-primary bg-primary/5 px-3 py-1">
                    <CatIcon className="h-3 w-3 mr-2" /> {list.category}
                  </Badge>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenView(list)} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Visualizar">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleOpenEdit(list)} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Editar">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    {db && (
                      <button onClick={() => deleteDocumentNonBlocking(doc(db, "checklists", list.id))} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl font-black text-white uppercase tracking-tight leading-tight">
                  {list.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Scale className="h-3 w-3 text-primary/50" />
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{list.legalArea || "GERAL"}</span>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0 flex-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-6 line-clamp-2">
                  {list.description || "Roteiro tático sem descrição técnica."}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-[0.2em]">
                    <ListPlus className="h-3.5 w-3.5" /> {list.items?.length || 0} Campos Definidos
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* DIÁLOGO DE VISUALIZAÇÃO */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[800px] w-[95vw] p-0 overflow-hidden shadow-2xl flex flex-col h-[90vh] font-sans rounded-3xl gap-0">
          <div className="p-8 md:p-10 bg-[#0a0f1e] border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 flex-none">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
                <Eye className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                  {viewingList?.title}
                </DialogTitle>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[9px] font-black border-primary/30 text-primary uppercase">{viewingList?.category}</Badge>
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">• {viewingList?.legalArea}</span>
                </div>
              </div>
            </div>
            <Button onClick={() => { setIsViewDialogOpen(false); handleOpenEdit(viewingList); }} className="gold-gradient text-background font-black uppercase text-[11px] px-8 h-12 rounded-xl shadow-xl">
              ABRIR EDITOR
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-10 space-y-10">
              {viewingList?.description && (
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 shadow-inner">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Finalidade Estratégica</Label>
                  <p className="text-sm text-white/80 leading-relaxed font-medium">{viewingList.description}</p>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Inventário de Campos ({viewingList?.items?.length || 0})</h4>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {viewingList?.items?.map((item: any, idx: number) => (
                    <div key={idx} className="p-5 rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all shadow-lg">
                      <div className="flex items-center gap-5">
                        <span className="text-[10px] font-mono font-black text-muted-foreground/30">#{idx + 1}</span>
                        <div>
                          <p className="text-sm font-bold text-white uppercase tracking-tight">{item.label}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <Badge variant="secondary" className="bg-white/5 text-[8px] font-black uppercase text-muted-foreground">{item.type}</Badge>
                            {item.required && <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase">Obrigatório</Badge>}
                            {item.balizaObrigatoria && <Badge variant="outline" className="border-amber-500/20 text-amber-500 text-[8px] font-black uppercase">Baliza IA</Badge>}
                          </div>
                        </div>
                      </div>
                      {item.reuseEnabled && (
                        <div className="flex items-center gap-2 text-primary/40 group-hover:text-primary transition-colors">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Reaproveitável</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex-none">
            <Button variant="ghost" onClick={() => setIsViewDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-10 h-14 hover:text-white transition-colors">
              FECHAR DOSSIÊ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl flex flex-col h-[95vh] font-sans gap-0">
          {/* Header Editor de Modelo */}
          <div className="p-8 md:p-10 bg-[#0a0f1e] border-b border-white/5 space-y-6 flex-none">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <FileEdit className="h-8 w-8 text-primary" />
                <DialogTitle className="text-white font-headline text-4xl uppercase tracking-tighter">
                  Editor de Modelo
                </DialogTitle>
              </div>
              <DialogDescription className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                Desenvolva o passo a passo padrão para as rotinas do escritório.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">
                  ETAPA {currentStepIndex + 1}/{EDITOR_STEPS.length}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {EDITOR_STEPS[currentStepIndex]?.label}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {EDITOR_STEPS.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setEditorStep(step.id)}
                    className={cn(
                      "h-11 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                      editorStep === step.id
                        ? "border-primary bg-primary text-[#0a0f1e]"
                        : "border-white/10 bg-black/30 text-muted-foreground hover:text-white hover:border-primary/40",
                      index <= currentStepIndex && editorStep !== step.id && "text-white/80"
                    )}
                  >
                    {step.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-8 md:p-10 space-y-12">
              {editorStep === "geral" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-8 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">TÍTULO DO CHECKLIST *</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value.toUpperCase())}
                      placeholder="Ex: PROTOCOLO DE INICIAL TRABALHISTA"
                      className="bg-black/40 border-white/10 h-14 text-white font-bold focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CATEGORIA</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-black/40 border-primary h-14 text-white ring-1 ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <cat.icon className="h-3.5 w-3.5 opacity-50" />
                              {cat.label.toUpperCase()}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-12 space-y-2">
                    <Label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <Scale className="h-3.5 w-3.5" /> ÁREA JURÍDICA VINCULADA
                    </Label>
                    <Select value={legalArea} onValueChange={handleLegalAreaChange}>
                      <SelectTrigger className="bg-black/40 border-primary h-14 text-white ring-1 ring-primary/20">
                        <SelectValue placeholder="Selecione a área para vincular esta entrevista..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                        {LEGAL_AREAS.map(area => (
                          <SelectItem key={area} value={area}>{area.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[9px] text-muted-foreground italic font-medium uppercase tracking-tight">
                      * AO TROCAR A AREA, O PADRAO DA AREA E APLICADO MEDIANTE CONFIRMACAO.
                    </p>
                  </div>

                  <div className="md:col-span-12 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">DESCRIÇÃO / FINALIDADE</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descreva quando e por quem este checklist deve ser executado..."
                      className="bg-black/40 border-white/10 min-h-[120px] text-white text-sm focus:ring-1 focus:ring-primary/50 resize-none"
                    />
                  </div>
                </div>
              )}

              {editorStep === "perguntas" && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3">
                        <LayoutGrid className="h-5 w-5" /> ELEMENTOS DA ENTREVISTA
                      </h4>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Defina as perguntas e campos de captura de dados.</p>
                      <p className="text-[9px] font-bold text-primary/80 uppercase tracking-wider">
                        Voce pode aplicar o padrao da area selecionada e editar tudo em seguida.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-black uppercase tracking-widest",
                            items.length >= MIN_QUESTIONS_REQUIRED
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
                              : "border-amber-500/40 text-amber-300 bg-amber-500/5"
                          )}
                        >
                          {items.length} PERGUNTA{items.length === 1 ? "" : "S"} CRIADA{items.length === 1 ? "" : "S"}
                        </Badge>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                          mínimo: {MIN_QUESTIONS_REQUIRED}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto border-primary/35 bg-primary/5 text-primary hover:bg-primary hover:text-[#0a0f1e] font-black uppercase text-[10px] tracking-widest gap-2 h-12 px-6"
                          >
                            <ListPlus className="h-4 w-4" /> PERGUNTAS PRONTAS
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-80 max-h-[65vh] overflow-y-auto bg-[#0d121f] border-white/10 text-white"
                        >
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            Biblioteca tatica
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            onClick={() => handleApplyDefaultChecklist(legalArea)}
                            className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/20"
                          >
                            <ShieldCheck className="h-4 w-4 text-primary" /> APLICAR PADRAO {legalArea.toUpperCase()} ({selectedAreaPreset.templateIds.length})
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            onClick={handleAddStarterPack}
                            className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/20"
                          >
                            <PlusCircle className="h-4 w-4 text-primary" /> INSERIR PACOTE RAPIDO ({READY_TEMPLATE_STARTER_PACK.length})
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAddAreaPack(legalArea)}
                            className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/20"
                          >
                            <Plus className="h-4 w-4 text-primary" /> SOMAR PACOTE {legalArea.toUpperCase()} ({selectedAreaPreset.templateIds.length})
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">
                            Aplicar por area
                          </DropdownMenuLabel>
                          {LEGAL_AREAS.map((area) => (
                            <DropdownMenuItem
                              key={`preset-${area}`}
                              onClick={() => handleApplyDefaultChecklist(area)}
                              className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/20"
                            >
                              APLICAR {area.toUpperCase()}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">
                            Perguntas individuais ({legalArea.toUpperCase()})
                          </DropdownMenuLabel>
                          {selectedAreaTemplates.map((template) => (
                            <DropdownMenuItem
                              key={template.id}
                              onClick={() => handleAddReadyQuestionById(template.id)}
                              className="text-[10px] font-bold uppercase tracking-wide focus:bg-primary/20"
                            >
                              {template.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        onClick={handleAddField}
                        className="w-full sm:w-auto gold-gradient text-background font-black uppercase text-[11px] tracking-widest gap-2 h-12 px-8 rounded-xl shadow-xl shadow-primary/10"
                      >
                        <Plus className="h-4 w-4" /> ADICIONAR PERGUNTA
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {items.length === 0 ? (
                      <div className="p-20 border-2 border-dashed border-white/5 rounded-[2rem] text-center space-y-6 opacity-20">
                        <div className="w-20 h-20 rounded-full border border-white/10 mx-auto flex items-center justify-center">
                          <ListPlus className="h-10 w-10 text-primary" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.5em]">Nenhum elemento tático definido.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {items.map((item, idx) => (
                          <div key={idx} className="p-5 rounded-[1.25rem] bg-white/[0.02] border border-white/5 space-y-4 relative group hover:border-primary/20 transition-all">
                            <div className="flex justify-between items-center">
                              <Badge variant="outline" className="text-[10px] font-black text-primary border-primary/20 bg-primary/5 px-4">ITEM #{idx + 1}</Badge>
                              <button
                                onClick={() => handleRemoveField(idx)}
                                className="text-rose-500 hover:text-white hover:bg-rose-500/20 p-2.5 rounded-xl transition-all"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                              <div className="md:col-span-7 space-y-2">
                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">PERGUNTA / RÓTULO DE CAMPO</Label>
                                <Input
                                  value={item.label}
                                  onChange={(e) => handleUpdateField(idx, 'label', e.target.value.toUpperCase())}
                                  className="bg-black/20 border-white/10 h-12 text-sm text-white font-bold focus:ring-1 focus:ring-primary/50"
                                  placeholder="EX: QUAL O ÚLTIMO SALÁRIO NOMINAL?"
                                />
                              </div>
                              <div className="md:col-span-3 space-y-2">
                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">INTELIGÊNCIA DE RESPOSTA</Label>
                                <Select value={item.type} onValueChange={(v) => handleUpdateField(idx, 'type', v)}>
                                  <SelectTrigger className="bg-black/20 border-primary h-12 text-[10px] text-white uppercase font-black ring-1 ring-primary/20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                                    {FIELD_TYPES.map(type => (
                                      <SelectItem key={type.id} value={type.id}>
                                        <div className="flex items-center gap-3">
                                          <type.icon className="h-4 w-4 opacity-50" />
                                          {type.label.toUpperCase()}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="md:col-span-2 flex items-center gap-3 pb-2">
                                <Switch
                                  id={`req-${idx}`}
                                  checked={item.required}
                                  onCheckedChange={(v) => handleUpdateField(idx, 'required', v)}
                                  className="data-[state=checked]:bg-emerald-500"
                                />
                                <Label htmlFor={`req-${idx}`} className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> OBRIGATÓRIO
                                </Label>
                              </div>
                            </div>

                            {/* SISTEMA DE REUSO DE DADOS */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                              <div className="md:col-span-3 flex items-center gap-3 pb-2">
                                <Switch
                                  id={`reuse-${idx}`}
                                  checked={Boolean(item.reuseEnabled)}
                                  onCheckedChange={(v) => handleUpdateField(idx, 'reuseEnabled', v)}
                                  className="data-[state=checked]:bg-primary"
                                />
                                <Label htmlFor={`reuse-${idx}`} className="text-[9px] font-black text-white uppercase tracking-widest cursor-pointer">
                                  REAPROVEITAR DADOS
                                </Label>
                              </div>

                              <div className="md:col-span-3 space-y-2">
                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">DESTINO DO DADO</Label>
                                <Select
                                  value={item.reuseTarget || "caseDetails"}
                                  onValueChange={(v) => {
                                    const fallbackField = TARGET_FIELDS_BY_REUSE_TARGET[v]?.[0]?.id || ""
                                    setItems((prev) => {
                                      const next = [...prev]
                                      next[idx] = {
                                        ...next[idx],
                                        reuseTarget: v,
                                        targetField: fallbackField,
                                      }
                                      return next
                                    })
                                  }}
                                  disabled={!item.reuseEnabled}
                                >
                                  <SelectTrigger className="bg-black/20 border-primary h-11 text-[10px] text-white uppercase font-black ring-1 ring-primary/20 disabled:opacity-50">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                                    {REUSE_TARGETS.map(target => (
                                      <SelectItem key={target.id} value={target.id}>{target.label.toUpperCase()}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="md:col-span-4 space-y-2">
                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">CAMPO MAPEADO</Label>
                                <Select
                                  value={item.targetField || TARGET_FIELDS_BY_REUSE_TARGET[item.reuseTarget || "caseDetails"]?.[0]?.id || ""}
                                  onValueChange={(v) => handleUpdateField(idx, 'targetField', v)}
                                  disabled={!item.reuseEnabled}
                                >
                                  <SelectTrigger className="bg-black/20 border-primary h-11 text-[10px] text-white uppercase font-black ring-1 ring-primary/20 disabled:opacity-50">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                                    {(TARGET_FIELDS_BY_REUSE_TARGET[item.reuseTarget || "caseDetails"] || []).map((field) => (
                                      <SelectItem key={field.id} value={field.id}>{field.label.toUpperCase()}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="md:col-span-2 space-y-2">
                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">PRIORIDADE</Label>
                                <Select
                                  value={item.reusePriority || "media"}
                                  onValueChange={(v) => handleUpdateField(idx, 'reusePriority', v)}
                                  disabled={!item.reuseEnabled}
                                >
                                  <SelectTrigger className="bg-black/20 border-primary h-11 text-[10px] text-white uppercase font-black ring-1 ring-primary/20 disabled:opacity-50">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                                    {REUSE_PRIORITIES.map(priority => (
                                      <SelectItem key={priority.id} value={priority.id}>{priority.label.toUpperCase()}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="md:col-span-3 flex items-center gap-3 pb-2">
                                <Switch
                                  id={`baliza-${idx}`}
                                  checked={Boolean(item.balizaObrigatoria)}
                                  onCheckedChange={(v) => handleUpdateField(idx, 'balizaObrigatoria', v)}
                                  className="data-[state=checked]:bg-amber-500"
                                />
                                <Label htmlFor={`baliza-${idx}`} className="text-[9px] font-black text-white uppercase tracking-widest cursor-pointer">
                                  BALIZA OBRIGATÓRIA (IA)
                                </Label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editorStep === "revisao" && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 flex items-start gap-4 shadow-xl">
                    {title.trim() && items.length > 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Validação do Modelo</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {title.trim() && items.length > 0
                          ? "Modelo pronto para disponibilizar na banca."
                          : "Complete os dados obrigatórios para finalizar a publicação."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-white/[0.02] border-white/10 shadow-lg">
                      <CardContent className="p-6 space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Dados Gerais</p>
                        <div className="space-y-1">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Título</p>
                          <p className="text-sm font-black text-white">{title || "NÃO INFORMADO"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Categoria</p>
                          <p className="text-sm font-black text-white">{category.toUpperCase()}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Área Jurídica</p>
                          <p className="text-sm font-black text-white">{legalArea.toUpperCase()}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/[0.02] border-white/10 shadow-lg">
                      <CardContent className="p-6 space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">DNA de Captura</p>
                        <p className="text-3xl font-black text-white">{items.length}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">perguntas configuradas</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/30 text-primary bg-primary/5">
                            {items.filter((item) => item.reuseEnabled).length} REAPROVEITÁVEIS
                          </Badge>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-amber-500/30 text-amber-300 bg-amber-500/5">
                            {items.filter((item) => item.balizaObrigatoria).length} BALIZAS (IA)
                          </Badge>
                        </div>
                        <Button
                          onClick={() => setEditorStep("perguntas")}
                          variant="outline"
                          className="mt-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" /> Ajustar Inteligência
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-white/[0.02] border-white/10 shadow-lg">
                    <CardContent className="p-6 space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Descrição / Finalidade</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {description || "Sem descrição informada."}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer Editor de Modelo */}
          <div className="p-8 md:p-10 bg-black/40 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 flex-none">
            <button 
              onClick={() => setIsDialogOpen(false)} 
              className="text-muted-foreground uppercase font-black text-[11px] tracking-[0.2em] hover:text-white transition-colors"
            >
              DESCARTAR ALTERAÇÕES
            </button>

            <div className="w-full md:w-auto flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousStep}
                disabled={!canGoBack}
                className="h-12 border-white/15 bg-transparent text-white hover:bg-white/5 disabled:opacity-40"
              >
                VOLTAR
              </Button>

              {isLastStep ? (
                <Button
                  onClick={handleSave}
                  className="w-full md:w-auto gold-gradient text-background font-black uppercase text-[12px] tracking-widest px-10 h-12 rounded-xl shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                >
                  <ShieldCheck className="h-5 w-5" /> SALVAR E DISPONIBILIZAR NA BANCA
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full md:w-auto gold-gradient text-background font-black uppercase text-[12px] tracking-widest px-10 h-12 rounded-xl shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                >
                  PRÓXIMO <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isAreaChangeDialogOpen}
        onOpenChange={(open) => {
          setIsAreaChangeDialogOpen(open)
          if (!open) {
            setPendingAreaChange(null)
          }
        }}
      >
        <AlertDialogContent className="glass border-white/10 bg-[#0d121f] text-white font-sans shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-xl font-black uppercase tracking-tight">
              Aplicar padrao da area
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              A troca para {pendingAreaChange?.toUpperCase() || "NOVA AREA"} vai sobrescrever titulo, descricao e perguntas atuais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1 shadow-inner">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Impacto da troca</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/90">
              {currentQuestionsCount} pergunta(s) atual(is) -&gt; {pendingAreaQuestionsCount} pergunta(s) do novo padrao
            </p>
          </div>
          {pendingAreaPreviewQuestions.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2 shadow-inner">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/90">Preview das 3 primeiras</p>
              <ul className="space-y-1">
                {pendingAreaPreviewQuestions.map((question, index) => (
                  <li key={`${question.id}-${index}`} className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider text-white/85">
                    <span>{index + 1}. {question.label}</span>
                    {question.balizaObrigatoria && (
                      <span className="px-2 py-0.5 rounded-full border border-amber-400/30 bg-amber-500/10 text-[8px] font-black uppercase tracking-widest text-amber-300">
                        Baliza
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {pendingAreaPreviewBalizasCount > 0 && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  {pendingAreaPreviewBalizasCount} baliza(s) obrigatoria(s) neste preview
                </p>
              )}
              {pendingAreaQuestionsCount > pendingAreaPreviewQuestions.length && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  ... e mais {pendingAreaQuestionsCount - pendingAreaPreviewQuestions.length} pergunta(s)
                </p>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelAreaChange}
              className="border-white/15 bg-transparent text-white hover:bg-white/5 rounded-lg"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAreaChange}
              className="gold-gradient text-background font-black uppercase tracking-widest rounded-lg shadow-lg"
            >
              Aplicar e sobrescrever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
