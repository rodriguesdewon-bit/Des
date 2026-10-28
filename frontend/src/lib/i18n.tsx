import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type Lang = "pt" | "en" | "es";
export type Currency = "BRL" | "USD" | "EUR" | "MXN" | "ARS";

export interface Country {
  code: string;
  name: string;
  lang: Lang;
  currency: Currency;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: "BR", name: "Brasil", lang: "pt", currency: "BRL", flag: "🇧🇷" },
  { code: "PT", name: "Portugal", lang: "pt", currency: "EUR", flag: "🇵🇹" },
  { code: "US", name: "United States", lang: "en", currency: "USD", flag: "🇺🇸" },
  { code: "ES", name: "España", lang: "es", currency: "EUR", flag: "🇪🇸" },
  { code: "MX", name: "México", lang: "es", currency: "MXN", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", lang: "es", currency: "ARS", flag: "🇦🇷" },
];

// All values are stored in BRL; display currencies use a fixed reference rate (1 BRL = x).
const RATES: Record<Currency, number> = { BRL: 1, USD: 0.18, EUR: 0.165, MXN: 3.3, ARS: 205 };
const LOCALES: Record<Lang, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" };

const D = {
  app_tagline: ["Gestão inteligente de veículos e custo por KM", "Smart vehicle management & cost per KM", "Gestión inteligente de vehículos y costo por KM"],
  hero_title: ["Saiba quanto seu veículo custa por quilômetro.", "Know what your vehicle costs per kilometer.", "Descubre cuánto cuesta tu vehículo por kilómetro."],
  hero_sub: ["Combustível, manutenção e parcela do financiamento num só número. Sem planilhas, sem digitação manual.", "Fuel, maintenance and loan installment in a single number. No spreadsheets, no typing.", "Combustible, mantenimiento y cuota del financiamiento en un solo número. Sin planillas."],
  cta_start: ["Começar grátis", "Start for free", "Empezar gratis"],
  cta_login: ["Já tenho conta", "I have an account", "Ya tengo cuenta"],
  feat_1: ["Cadastro em 1 minuto com listas prontas", "1-minute setup with ready-made lists", "Registro en 1 minuto con listas listas"],
  feat_2: ["Gasto mensal, diário e R$/KM automáticos", "Automatic monthly, daily and cost/KM", "Gasto mensual, diario y costo/KM automáticos"],
  feat_3: ["Alertas 1 semana antes de cada manutenção", "Alerts 1 week before each service", "Alertas 1 semana antes de cada mantenimiento"],
  feat_4: ["Fundo de reserva diário para peças", "Daily reserve fund for parts", "Fondo de reserva diario para piezas"],
  login: ["Entrar", "Sign in", "Entrar"],
  register: ["Criar conta", "Create account", "Crear cuenta"],
  name: ["Nome", "Name", "Nombre"],
  email: ["E-mail", "Email", "Correo"],
  password: ["Senha", "Password", "Contraseña"],
  google: ["Continuar com Google", "Continue with Google", "Continuar con Google"],
  or: ["ou", "or", "o"],
  invalid_credentials: ["E-mail ou senha inválidos", "Invalid email or password", "Correo o contraseña inválidos"],
  email_exists: ["Este e-mail já está cadastrado", "This email is already registered", "Este correo ya está registrado"],
  generic_error: ["Algo deu errado. Tente novamente.", "Something went wrong. Try again.", "Algo salió mal. Inténtalo de nuevo."],
  signing_in: ["Conectando sua conta...", "Signing you in...", "Conectando tu cuenta..."],
  logout: ["Sair", "Sign out", "Salir"],
  plans: ["Planos PRO", "PRO plans", "Planes PRO"],
  admin: ["Painel admin", "Admin panel", "Panel admin"],
  language: ["Idioma", "Language", "Idioma"],
  country: ["País e moeda", "Country & currency", "País y moneda"],
  step: ["Passo", "Step", "Paso"],
  of: ["de", "of", "de"],
  back: ["Voltar", "Back", "Volver"],
  next: ["Continuar", "Continue", "Continuar"],
  finish: ["Ver meus custos", "See my costs", "Ver mis costos"],
  q_type: ["Qual é o seu veículo?", "What is your vehicle?", "¿Cuál es tu vehículo?"],
  moto: ["Moto", "Motorcycle", "Moto"],
  carro: ["Carro", "Car", "Auto"],
  caminhao: ["Caminhão", "Truck", "Camión"],
  q_details: ["Marca, modelo e ano", "Brand, model and year", "Marca, modelo y año"],
  brand: ["Marca", "Brand", "Marca"],
  model: ["Modelo", "Model", "Modelo"],
  year: ["Ano", "Year", "Año"],
  odometer: ["Hodômetro atual (km)", "Current odometer (km)", "Odómetro actual (km)"],
  select: ["Selecione", "Select", "Selecciona"],
  q_acq: ["O veículo já está quitado ou você ainda paga por ele?", "Is the vehicle paid off or are you still paying for it?", "¿El vehículo está pagado o aún lo estás pagando?"],
  paid: ["Quitado / À vista", "Paid off / Cash", "Pagado / Al contado"],
  paid_sub: ["Sem parcelas mensais", "No monthly installments", "Sin cuotas mensuales"],
  financed: ["Financiado / Parcelado / Cartão", "Financed / Installments / Card", "Financiado / En cuotas / Tarjeta"],
  financed_sub: ["A parcela entra no gasto mensal", "Installment counts in monthly cost", "La cuota entra en el gasto mensual"],
  installment: ["Valor da parcela mensal (R$)", "Monthly installment (R$)", "Cuota mensual (R$)"],
  months_left: ["Quantos meses faltam", "Months remaining", "Meses restantes"],
  q_consumption: ["Consumo e combustível", "Consumption & fuel", "Consumo y combustible"],
  suggested: ["Consumo sugerido para o seu veículo", "Suggested consumption for your vehicle", "Consumo sugerido para tu vehículo"],
  confirm_consumption: ["Este é o consumo do seu veículo ou deseja ajustar?", "Is this your vehicle's consumption or do you want to adjust?", "¿Es este el consumo de tu vehículo o deseas ajustarlo?"],
  confirm: ["Confirmar", "Confirm", "Confirmar"],
  adjust: ["Ajustar", "Adjust", "Ajustar"],
  confirmed: ["Confirmado", "Confirmed", "Confirmado"],
  fuel: ["Combustível", "Fuel", "Combustible"],
  gasolina: ["Gasolina", "Gasoline", "Gasolina"],
  etanol: ["Etanol", "Ethanol", "Etanol"],
  flex: ["Flex", "Flex", "Flex"],
  diesel: ["Diesel", "Diesel", "Diésel"],
  fuel_used: ["Combustível que você usa", "Fuel you use", "Combustible que usas"],
  state: ["Estado", "State", "Estado"],
  use_location: ["Usar minha localização", "Use my location", "Usar mi ubicación"],
  locating: ["Localizando...", "Locating...", "Ubicando..."],
  location_denied: ["Não foi possível obter a localização", "Could not get your location", "No se pudo obtener la ubicación"],
  fuel_price: ["Preço do litro (média do estado, editável)", "Price per liter (state average, editable)", "Precio por litro (promedio estatal, editable)"],
  fuel_price_hint: ["Tem desconto ou um posto mais barato? Edite o valor.", "Got a discount or cheaper station? Edit the value.", "¿Tienes descuento? Edita el valor."],
  q_routine: ["Rotina de uso", "Usage routine", "Rutina de uso"],
  km_per_day: ["Quantos km você percorre por dia em média?", "How many km do you drive per day on average?", "¿Cuántos km recorres por día en promedio?"],
  which_days: ["Em quais dias da semana você usa?", "Which days of the week do you use it?", "¿Qué días de la semana lo usas?"],
  preview: ["Prévia do custo", "Cost preview", "Vista previa del costo"],
  monthly_cost: ["Gasto mensal estimado", "Estimated monthly cost", "Gasto mensual estimado"],
  daily_cost: ["Custo diário", "Daily cost", "Costo diario"],
  cost_per_km: ["Custo por KM", "Cost per KM", "Costo por KM"],
  monthly_km: ["KM por mês", "KM per month", "KM por mes"],
  maintenance: ["Manutenção", "Maintenance", "Mantenimiento"],
  installment_short: ["Parcela", "Installment", "Cuota"],
  vehicle_saved: ["Veículo cadastrado!", "Vehicle saved!", "¡Vehículo registrado!"],
  pro_required: ["Recurso exclusivo PRO", "PRO-only feature", "Función exclusiva PRO"],
  multi_vehicle_pro: ["Cadastrar mais de um veículo é exclusivo do PRO", "Adding more than one vehicle is PRO-only", "Registrar más de un vehículo es exclusivo PRO"],
  unlock_pro: ["Desbloquear PRO", "Unlock PRO", "Desbloquear PRO"],
  add_vehicle: ["Adicionar veículo", "Add vehicle", "Agregar vehículo"],
  my_vehicles: ["Meus veículos", "My vehicles", "Mis vehículos"],
  breakdown: ["Composição do gasto", "Cost breakdown", "Composición del gasto"],
  per_month: ["/mês", "/month", "/mes"],
  per_day: ["/dia", "/day", "/día"],
  reserve_fund: ["Fundo de reserva diário", "Daily reserve fund", "Fondo de reserva diario"],
  reserve_sub: ["Separe este valor por dia para pagar as próximas trocas sem surpresas.", "Set aside this amount daily to pay for the next services without surprises.", "Separa este valor por día para pagar los próximos cambios sin sorpresas."],
  reserve_teaser: ["Descubra quanto separar por dia para nunca ser pego de surpresa.", "Find out how much to save daily so you're never caught off guard.", "Descubre cuánto separar por día para no tener sorpresas."],
  schedule: ["Cronograma de manutenção", "Maintenance schedule", "Cronograma de mantenimiento"],
  schedule_free: ["Revisões recomendadas para o seu veículo", "Recommended services for your vehicle", "Revisiones recomendadas para tu vehículo"],
  every: ["a cada", "every", "cada"],
  months: ["meses", "months", "meses"],
  km_left: ["km restantes", "km left", "km restantes"],
  days_left: ["dias", "days", "días"],
  next_at: ["Próxima em", "Next at", "Próxima en"],
  st_ok: ["Em dia", "On track", "Al día"],
  st_soon: ["Próxima", "Due soon", "Próxima"],
  st_overdue: ["Vencida", "Overdue", "Vencida"],
  alerts: ["Alertas", "Alerts", "Alertas"],
  no_alerts: ["Nenhuma manutenção próxima. Tudo em dia!", "No upcoming maintenance. All good!", "Ningún mantenimiento próximo. ¡Todo al día!"],
  alerts_teaser: ["Receba alertas 1 semana antes de cada troca.", "Get alerts 1 week before each service.", "Recibe alertas 1 semana antes de cada cambio."],
  mark_done: ["Registrar troca", "Log service", "Registrar cambio"],
  edit_price: ["Editar preço", "Edit price", "Editar precio"],
  part_price: ["Preço na sua oficina (R$)", "Price at your shop (R$)", "Precio en tu taller (R$)"],
  interval_km: ["Intervalo (km)", "Interval (km)", "Intervalo (km)"],
  save: ["Salvar", "Save", "Guardar"],
  saved: ["Salvo!", "Saved!", "¡Guardado!"],
  cancel: ["Cancelar", "Cancel", "Cancelar"],
  km_at_service: ["KM no momento da troca", "KM at service", "KM en el cambio"],
  date: ["Data", "Date", "Fecha"],
  cost_paid: ["Valor pago (R$)", "Amount paid (R$)", "Monto pagado (R$)"],
  note: ["Observação", "Note", "Nota"],
  history: ["Histórico de manutenções", "Maintenance history", "Historial de mantenimiento"],
  no_history: ["Nenhuma troca registrada ainda.", "No services logged yet.", "Ningún cambio registrado aún."],
  history_teaser: ["Guarde todo o histórico e personalize os preços das peças.", "Keep full history and customize part prices.", "Guarda todo el historial y personaliza los precios."],
  edit_vehicle: ["Editar dados", "Edit details", "Editar datos"],
  update_odometer: ["Atualizar hodômetro", "Update odometer", "Actualizar odómetro"],
  delete_vehicle: ["Excluir veículo", "Delete vehicle", "Eliminar vehículo"],
  deleted: ["Veículo excluído", "Vehicle deleted", "Vehículo eliminado"],
  pro_badge: ["PRO", "PRO", "PRO"],
  pro_lifetime: ["PRO Vitalício", "Lifetime PRO", "PRO Vitalicio"],
  pro_until: ["PRO até", "PRO until", "PRO hasta"],
  free_plan: ["Plano grátis", "Free plan", "Plan gratis"],
  choose_plan: ["Escolha seu plano PRO", "Choose your PRO plan", "Elige tu plan PRO"],
  checkout_sub: ["Alertas preventivos, fundo de reserva, histórico, preços personalizados e vários veículos.", "Preventive alerts, reserve fund, history, custom prices and multiple vehicles.", "Alertas preventivas, fondo de reserva, historial, precios personalizados y varios vehículos."],
  plan_annual: ["Assinatura Anual", "Annual plan", "Plan anual"],
  plan_monthly: ["Assinatura Mensal", "Monthly plan", "Plan mensual"],
  plan_single: ["Pix Avulso (1 mês)", "One-off Pix (1 month)", "Pix único (1 mes)"],
  best_choice: ["Melhor escolha · Mais econômico", "Best choice · Best value", "Mejor opción · Más económico"],
  annual_note: ["Equivale a R$ 12,49/mês", "Same as R$ 12.49/month", "Equivale a R$ 12,49/mes"],
  monthly_note: ["Pix ou cartão · sem fidelidade", "Pix or card · cancel anytime", "Pix o tarjeta · sin permanencia"],
  single_note: ["Apenas 1 mês, sem assinatura", "Just 1 month, no subscription", "Solo 1 mes, sin suscripción"],
  per_year: ["/ano", "/year", "/año"],
  pay_with_pix: ["Pagar com Pix", "Pay with Pix", "Pagar con Pix"],
  pay_with_card: ["Pagar com cartão", "Pay with card", "Pagar con tarjeta"],
  card_note: ["Cartão via Stripe: PRO liberado na hora após aprovação.", "Card via Stripe: PRO unlocks instantly once approved.", "Tarjeta vía Stripe: PRO se libera al instante."],
  stripe_checking: ["Confirmando seu pagamento...", "Confirming your payment...", "Confirmando tu pago..."],
  stripe_success: ["Pagamento confirmado! Seu PRO está ativo.", "Payment confirmed! Your PRO is active.", "¡Pago confirmado! Tu PRO está activo."],
  stripe_failed: ["Não conseguimos confirmar o pagamento.", "We couldn't confirm the payment.", "No pudimos confirmar el pago."],
  stripe_cancel: ["Pagamento cancelado. Nenhuma cobrança foi feita.", "Payment canceled. You were not charged.", "Pago cancelado. No se realizó ningún cargo."],
  try_again: ["Tentar novamente", "Try again", "Intentar de nuevo"],
  pix_title: ["Pague com Pix", "Pay with Pix", "Paga con Pix"],
  pix_steps: ["Abra o app do seu banco, escolha Pix Copia e Cola ou leia o QR Code. O valor já vem preenchido.", "Open your bank app, choose Pix Copy & Paste or scan the QR code. The amount is pre-filled.", "Abre la app de tu banco, elige Pix Copia y Pega o escanea el QR. El monto ya viene completo."],
  copy_pix: ["Copiar código Pix", "Copy Pix code", "Copiar código Pix"],
  copied: ["Copiado!", "Copied!", "¡Copiado!"],
  payer_name: ["Nome do titular da conta que pagou", "Name of the account holder who paid", "Nombre del titular que pagó"],
  payer_hint: ["Usamos esse nome para localizar seu Pix no extrato.", "We use this name to find your Pix in the statement.", "Usamos este nombre para encontrar tu Pix."],
  i_paid: ["Já realizei o pagamento — Liberar Acesso PRO", "I've paid — Unlock PRO access", "Ya pagué — Liberar acceso PRO"],
  pending_title: ["Pagamento em verificação", "Payment under review", "Pago en verificación"],
  pending_sub: ["Assim que o Pix for confirmado na conta, seu PRO é liberado automaticamente nesta tela.", "As soon as the Pix is confirmed, PRO unlocks automatically on this screen.", "Cuando el Pix se confirme, PRO se libera automáticamente aquí."],
  approved_title: ["PRO liberado!", "PRO unlocked!", "¡PRO liberado!"],
  rejected_title: ["Pagamento não identificado", "Payment not found", "Pago no identificado"],
  rejected_sub: ["Não localizamos este Pix. Gere um novo código ou fale com o suporte.", "We couldn't find this Pix. Generate a new code or contact support.", "No encontramos este Pix. Genera un nuevo código."],
  already_pro: ["Você já é PRO", "You are already PRO", "Ya eres PRO"],
  go_dashboard: ["Ir para o painel", "Go to dashboard", "Ir al panel"],
  amount: ["Valor", "Amount", "Monto"],
  txid: ["Identificador", "Reference", "Identificador"],
  currency_note: ["Cobrança em reais (BRL) via Pix.", "Charged in Brazilian reais (BRL) via Pix.", "Cobro en reales (BRL) vía Pix."],
  my_payments: ["Meus pagamentos", "My payments", "Mis pagos"],
  ps_awaiting_payment: ["Aguardando pagamento", "Awaiting payment", "Esperando pago"],
  ps_pending_review: ["Em verificação", "Under review", "En verificación"],
  ps_approved: ["Aprovado", "Approved", "Aprobado"],
  ps_rejected: ["Recusado", "Rejected", "Rechazado"],
  admin_title: ["Confirmação de pagamentos Pix", "Pix payment confirmations", "Confirmación de pagos Pix"],
  admin_sub: ["Confira o Pix no extrato do Nubank (valor + nome do pagador) antes de aprovar.", "Check the Pix in your Nubank statement (amount + payer name) before approving.", "Verifica el Pix en tu extracto antes de aprobar."],
  approve: ["Aprovar PRO", "Approve PRO", "Aprobar PRO"],
  reject: ["Recusar", "Reject", "Rechazar"],
  no_payments: ["Nenhum pagamento aqui.", "No payments here.", "Ningún pago aquí."],
  user: ["Usuário", "User", "Usuario"],
  payer: ["Pagador", "Payer", "Pagador"],
  plan: ["Plano", "Plan", "Plan"],
  pricing_title: ["Grátis para começar. PRO para nunca ser pego de surpresa.", "Free to start. PRO so you're never caught off guard.", "Gratis para empezar. PRO para no tener sorpresas."],
  free_f1: ["Cadastro do veículo e listas automáticas", "Vehicle setup with automatic lists", "Registro del vehículo con listas automáticas"],
  free_f2: ["Gasto mensal, diário e R$/KM com a parcela", "Monthly, daily and cost/KM incl. installment", "Gasto mensual, diario y costo/KM con cuota"],
  free_f3: ["Lista de manutenções recomendadas", "Recommended maintenance list", "Lista de mantenimientos recomendados"],
  pro_f1: ["Alertas 1 semana antes do vencimento", "Alerts 1 week before due", "Alertas 1 semana antes del vencimiento"],
  pro_f2: ["Fundo de reserva diário", "Daily reserve fund", "Fondo de reserva diario"],
  pro_f3: ["Histórico e preços da sua oficina", "History and your shop's prices", "Historial y precios de tu taller"],
  pro_f4: ["Vários veículos monitorados", "Multiple monitored vehicles", "Varios vehículos monitoreados"],
  loading: ["Carregando...", "Loading...", "Cargando..."],
  offline: ["Não foi possível carregar os dados agora.", "Could not load data right now.", "No se pudieron cargar los datos."],
  m_oil: ["Troca de óleo", "Oil change", "Cambio de aceite"],
  m_tires: ["Pneus", "Tires", "Neumáticos"],
  m_brakes: ["Pastilhas / Lonas de freio", "Brake pads / shoes", "Pastillas / Zapatas de freno"],
  m_transmission_moto: ["Kit relação (corrente)", "Chain & sprocket kit", "Kit de transmisión (cadena)"],
  m_transmission_carro: ["Correia dentada", "Timing belt", "Correa de distribución"],
  m_transmission_caminhao: ["Correia / Kit de transmissão", "Belt / Drivetrain kit", "Correa / Kit de transmisión"],
} satisfies Record<string, [string, string, string]>;

export type TKey = keyof typeof D;
const IDX: Record<Lang, number> = { pt: 0, en: 1, es: 2 };

export const WEEKDAYS: Record<Lang, string[]> = {
  pt: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  es: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
};

interface Prefs {
  lang: Lang;
  country: string;
  currency: Currency;
}

interface I18nValue extends Prefs {
  t: (key: TKey) => string;
  setLang: (lang: Lang) => void;
  setCountry: (code: string) => void;
  money: (brl: number, digits?: number) => string;
  brl: (value: number) => string;
  num: (value: number, digits?: number) => string;
  date: (iso: string) => string;
  maintenanceName: (key: string, type: string) => string;
}

const STORAGE_KEY = "kmc_prefs";
const DEFAULT_PREFS: Prefs = { lang: "pt", country: "BR", currency: "BRL" };

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

  const update = useCallback((next: Prefs) => {
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    document.documentElement.lang = LOCALES[next.lang];
  }, []);

  const value = useMemo<I18nValue>(() => {
    const locale = LOCALES[prefs.lang];
    const t = (key: TKey) => D[key][IDX[prefs.lang]];
    return {
      ...prefs,
      t,
      setLang: (lang) => update({ ...prefs, lang }),
      setCountry: (code) => {
        const c = COUNTRIES.find((x) => x.code === code) ?? COUNTRIES[0];
        update({ lang: c.lang, country: c.code, currency: c.currency });
      },
      money: (brl, digits = 2) =>
        new Intl.NumberFormat(locale, {
          style: "currency",
          currency: prefs.currency,
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }).format(brl * RATES[prefs.currency]),
      brl: (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v),
      num: (v, digits = 0) =>
        new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(v),
      date: (iso) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso)),
      maintenanceName: (key, type) => {
        const k = (key === "transmission" ? `m_transmission_${type}` : `m_${key}`) as TKey;
        return k in D ? t(k) : key;
      },
    };
  }, [prefs, update]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
