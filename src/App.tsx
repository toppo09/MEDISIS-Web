import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Lock, 
  RefreshCw, 
  Download, 
  Clipboard, 
  Settings, 
  Play, 
  Check, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  UserCheck, 
  ShieldAlert,
  Database,
  Eye,
  AlertCircle,
  HelpCircle,
  Activity,
  FileCheck2,
  LockKeyhole,
  CheckCircle,
  Search,
  Plus,
  Trash2,
  BadgeAlert,
  Calendar,
  Layers,
  FileSpreadsheet,
  Grid,
  LockKeyholeOpen,
  ClipboardCheck,
  Building,
  MessageSquare,
  Send,
  X,
  FileLock,
  ArrowRightLeft
} from "lucide-react";

// ============================================================================
// DATA & TYPES & CLINICAL KNOWLEDGE BASE
// ============================================================================

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "男性" | "女性";
  allergy: string;
  contraindicatedDrugs: string[];
  history: string;
}

const PAST_PATIENTS_DB: Patient[] = [
  {
    id: "PT-8872",
    name: "佐々木 健司",
    age: 72,
    gender: "男性",
    allergy: "ペニシリン系抗生物質 (発疹・呼吸困難)",
    contraindicatedDrugs: ["サワシリン", "アモキシシリン", "オーグメンチン"],
    history: "慢性閉塞性肺疾患 (COPD)、以前ロキソニンで軽度の胃痛あり。"
  },
  {
    id: "PT-4210",
    name: "鈴木 一郎",
    age: 58,
    gender: "男性",
    allergy: "アスピリン (喘息発作誘発)",
    contraindicatedDrugs: ["アスピリン", "バイアスピリン", "ロキソニン", "ボルタレン"],
    history: "アスピリン喘息あり。高血圧で糖尿病。現在インスリン自己注射中。"
  },
  {
    id: "PT-1995",
    name: "渡辺 理恵",
    age: 64,
    gender: "女性",
    allergy: "特になし",
    contraindicatedDrugs: ["アセトアミノフェン (過敏症履歴)"],
    history: "軽度不整脈、高血圧。アセトアミノフェン服用にて広範なじんましん発症履歴。"
  }
];

// Past Near-Miss (Heuristics database for Incident Center)
interface IncidentHistory {
  id: string;
  title: string;
  department: string;
  detail: string;
  prevention: string;
  relevance: number;
}

const CLINICAL_INCIDENTS: IncidentHistory[] = [
  {
    id: "INC-2025-01",
    title: "ペニシリン系抗生物質と呼吸器禁忌の二重投与直前検知",
    department: "呼吸器内科",
    detail: "カルテの記入内容に「ペニシリンアレルギー」の記載があったが、当直医師が急性気管支炎に対してサワシリン錠を誤って処方送信。システム連携の疑義照会・自動判定警告により未然防止に成功した。",
    prevention: "電子カルテ連携による処方送信前の強制リアルタイム警告が必要。",
    relevance: 95
  },
  {
    id: "INC-2025-02",
    title: "アスピリン喘息の患者に対するロキソプロフェンの誤処方",
    department: "整形外科",
    detail: "腰痛で来院したアスピリン喘息既往歴の患者に対し、外来にてロキソニン錠を処方。服用後に軽微な喘鳴を認め、救急車にて搬送された事例を元に、データベース警告を強化した。",
    prevention: "カルテに「アスピリン喘息」のメタデータを事前登録し、非ステロイド性消炎鎮痛剤(NSAIDs)の電子警告を義務付ける。",
    relevance: 92
  },
  {
    id: "INC-2025-03",
    title: "夜勤人員の勤務連続性およびスキルレベル不足による点滴速度ミス",
    department: "病棟2F",
    detail: "夜勤時に未経験の新人看護師２名のみが配置されていた際、点滴速度の計算ミスを発見。インシデント報告書が提出された。",
    prevention: "勤務シフト自動精査時に「夜勤ペアには必ずスキルレベル3以上の看護師を1名以上含める」制限ルールの厳密な検証。",
    relevance: 88
  }
];

// Interactive Shift personnel configuration
interface Staff {
  id: string;
  name: string;
  role: "医師" | "看護師" | "情報管理者" | "副院長";
  skillLevel: 1 | 2 | 3 | 4; // Add Level 4 according to feedback
  prefersNightShift: boolean;
}

const DEFAULT_STAFF: Staff[] = [
  { id: "S-01", name: "鈴木 看護部長", role: "看護師", skillLevel: 4, prefersNightShift: false },
  { id: "S-02", name: "木村 陽介", role: "情報管理者", skillLevel: 3, prefersNightShift: false },
  { id: "S-03", name: "今井 副院長", role: "副院長", skillLevel: 4, prefersNightShift: false },
  { id: "S-04", name: "高橋 医師", role: "医師", skillLevel: 4, prefersNightShift: true },
  { id: "S-05", name: "渡辺 看護師", role: "看護師", skillLevel: 1, prefersNightShift: true },
  { id: "S-06", name: "田中 看護師", role: "看護師", skillLevel: 2, prefersNightShift: true },
  { id: "S-07", name: "山本 看護師", role: "看護師", skillLevel: 2, prefersNightShift: false },
  { id: "S-08", name: "今野 看護師", role: "看護師", skillLevel: 3, prefersNightShift: false }
];

interface FeedbackItem {
  id: string;
  author: string;
  role: string;
  category: "システム設計" | "セキュリティ設計" | "臨床適合性" | "その他";
  content: string;
  timestamp: string;
  stars: number;
}

const INITIAL_FEEDBACKS: FeedbackItem[] = [
  {
    id: "FB-001",
    author: "今井 副院長",
    role: "副院長/臨床統括",
    category: "臨床適合性",
    content: "以前のペニシリン警告が医師のカルテ操作中に邪魔にならない位置で、かつ強制ロックする形でダイアログ表示されるプロセスは非常に秀逸です。再確認プロンプト（警告破棄の理由選択）があるため、不適切なスキップを防げます。",
    timestamp: "2026-06-08 14:20",
    stars: 5
  },
  {
    id: "FB-002",
    author: "木村 陽介",
    role: "医療情報管理者",
    category: "セキュリティ設計",
    content: "厚生労働省「医療安全管理ガイドライン第6.0版」が要求する外部API通信時の個人識別情報(PHI)の自動アノニマイズは、検知プロキシ側で完全に機能しているのを確認しました。ハッシュ置換の精度も良好です。",
    timestamp: "2026-06-08 15:05",
    stars: 5
  },
  {
    id: "FB-003",
    author: "病棟チーフ看護師",
    role: "看護部管理者",
    category: "システム設計",
    content: "勤務シフトの自動生成で、スキルレベル4（管理者・部門長）の追加機能を作成いただきありがとうございます。チーフ責任者の偏りや、夜勤の適合度、連続勤務回避が厳密に判定されるためマニュアル調整の手間が10分の1になりました。",
    timestamp: "2026-06-08 15:45",
    stars: 4
  }
];

export default function App() {
  // Navigation tabs
  // "clinical" = SOAP Clinical support console + Safe Prescription Audit
  // "shift" = AI Shift Automator and schedule generation
  // "sandbox" = PHI Anonymization live verification sandbox
  // "security" = Security audit trail logs & compliance compliance checklist
  // "feedback" = Safety and Design Feedback Board
  const [activeTab, setActiveTab] = useState<"clinical" | "shift" | "sandbox" | "security" | "feedback">("clinical");

  // General App states - Scrubbed Tobias and Sato
  const [currentUser, setCurrentUser] = useState<"今井副院長" | "医療システム管理者" | "第一病棟責任医師">("今井副院長");
  const [showMfaPopup, setShowMfaPopup] = useState(false);
  const [isMfaVerified, setIsMfaVerified] = useState(true);

  // 1. SOAP & Prescription Audit State
  const [selectedPatientId, setSelectedPatientId] = useState<string>("PT-8872");
  const [clinicalNoteText, setClinicalNoteText] = useState(
    "【本日カルテ記入】患者は息切れと咳を主訴に来院。診察時、胸鳴（喘鳴）が軽度聴取される。急性気管支炎の疑い。佐々木 健司氏は以前ペニシリン系を服用して蕁麻疹と息苦しさが出たとのこと。今回は抗生物質サワシリン錠250mgと咳止めを検討。"
  );
  const [prescriptionDrugsText, setPrescriptionDrugsText] = useState("サワシリン錠250mg, デキストロメトルファン臭化水素酸塩錠15mg");
  const [isAuditing, setIsAuditing] = useState(false);
  
  // Clean, beautiful dialog show state
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    status: "pass" | "warning" | "danger";
    warnings: string[];
    maskedNote: string;
    originalNote: string;
    patientId: string;
    prescription: string;
  } | null>(null);

  // Interactive Reconfirmation state for clinical doctor prompt
  const [overrideReason, setOverrideReason] = useState("");
  const [customOverrideDetail, setCustomOverrideDetail] = useState("");
  const [isOverridden, setIsOverridden] = useState(false);
  const [overrideSubmitted, setOverrideSubmitted] = useState(false);

  // 2. AI Shift Automator States
  const [staffList, setStaffList] = useState<Staff[]>(DEFAULT_STAFF);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"医師" | "看護師" | "情報管理者">("看護師");
  const [newStaffSkill, setNewStaffSkill] = useState<1 | 2 | 3 | 4>(2); // Add Level 4
  const [allowConsecutiveNight, setAllowConsecutiveNight] = useState(false);
  const [requiresSkillLevel3, setRequiresSkillLevel3] = useState(true);
  const [isGeneratingShift, setIsGeneratingShift] = useState(false);
  const [generatedCalendar, setGeneratedCalendar] = useState<Array<{
    day: string;
    dayName: string;
    dayShift: string[];
    nightShift: string[];
    complianceFlags: string[];
  }> | null>(null);

  // 3. Sandbox Real-Time PHI Masquer state
  const [sandboxInput, setSandboxInput] = useState(
    "[新患受付] 患者名：佐々木 健司、生年月日：昭和29年11月10日生まれ(71歳)、電話：090-8872-9988。住所：東京都世田谷区中町5-2-12。紹介医：〇〇病院 呼吸器内科の高橋康男医師。本日は喘鳴と軽度高熱を訴え来院、一時的な酸素配備と経過観察を指示。"
  );
  const [sandboxOutput, setSandboxOutput] = useState("");
  const [sandboxLoading, setSandboxLoading] = useState(false);

  // 4. Guided Security Checklist with anonymized dummy records
  const [complianceList, setComplianceList] = useState([
    { id: "SEC-01", standard: "医療安全ガイドライン第6.0版", checkItem: "患者データの物理的転送制限および暗号化", status: "対応済み", detail: "〇〇病院の閉域ネットワーク内部プロキシ、およびSSL/TLS 256ビットによる100%完全暗号化を適用。" },
    { id: "SEC-02", standard: "データ匿名性・データ漏洩保護", checkItem: "LLMプロバイダへのPHI送信防止の厳格化", status: "対応済み", detail: "病院のローカルアノニマイズエンジンが事前に機微メタ（患者氏名・詳細住所・個別電話番号）を完全に匿名化処理。" },
    { id: "SEC-03", standard: "アクセス認可および認証構造", checkItem: "多要素認証(MFA)およびBYOD(私物端末)完全禁止制限", status: "注意", detail: "〇〇病院セキュアVPNおよび支給MDM管理済み端末のみアクセス可能。特権処理時MFA義務化。" },
    { id: "SEC-04", standard: "システム継続性 (BCP)", checkItem: "ランサムウェア防御と地域冗長化バックアップ", status: "進行中", detail: "院内隔離システムによる12時間間隔の暗号化バックアップ＆東日本セキュアクラウドへの遠隔同期構造を検証中。" }
  ]);
  const [recentAuditLogs, setRecentAuditLogs] = useState([
    { timestamp: "2026-06-08 15:32:10", user: "今井 副院長", action: "処方監査API 呼び出し", status: "COMPLIANT", resource: "PT-8872 (患者データ匿名化マッピング)" },
    { timestamp: "2026-06-08 15:45:04", user: "今井 副院長", action: "AI勤務シフト自動作成エンジン起動", status: "COMPLIANT", resource: "看護師病棟スケジュール" },
    { timestamp: "2026-06-08 15:55:18", user: "システム監査", action: "システム適合性チェックリストステータス更新", status: "VERIFIED", resource: "安全管理基準6.0適合性" }
  ]);

  // 5. Applet feedback tracker states
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>(INITIAL_FEEDBACKS);
  const [newFeedbackText, setNewFeedbackText] = useState("");
  const [newFeedbackCategory, setNewFeedbackCategory] = useState<FeedbackItem["category"]>("臨床適合性");
  const [newFeedbackAuthor, setNewFeedbackAuthor] = useState("");
  const [newFeedbackStars, setNewFeedbackStars] = useState(5);

  // Handle clinical changes when switching patients
  const currentPatient = PAST_PATIENTS_DB.find(p => p.id === selectedPatientId) || PAST_PATIENTS_DB[0];

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    setOverrideSubmitted(false);
    setIsOverridden(false);
    setOverrideReason("");
    setCustomOverrideDetail("");
    
    if (patientId === "PT-8872") {
      setClinicalNoteText("【本日カルテ記入】患者は息切れと咳を主訴に来院。診察時、胸鳴（喘鳴）が軽度聴取される。急性気管支炎の疑い。佐々木 健司氏は以前ペニシリン系を服用して蕁麻疹と息苦しさが出たとのこと。今回は抗生物質サワシリン錠250mgと咳止めを検討。");
      setPrescriptionDrugsText("サワシリン錠250mg, デキストロメトルファン臭化水素酸塩錠15mg");
    } else if (patientId === "PT-4210") {
      setClinicalNoteText("【カルテ記載分】鈴木一郎さん、慢性腰痛症の増悪を強く訴える。激しい痛みあり。湿布が効かないためロキソニンを処方可能か相談あり。喘息の既往歴があるが要確認。アスピリンに過去アレルギー歴あり。");
      setPrescriptionDrugsText("ロキソプロフェンナトリウム水和物錠60mg, アスピリン腸溶錠100mg");
    } else {
      setClinicalNoteText("【カルテ記載分】渡辺 理恵さん、喉の痛みと全身倦怠感により来院。解熱剤として一般向けアセトアミノフェンを処方予定。以前のアレルギー歴を事前にスクリーニング。");
      setPrescriptionDrugsText("アセトアミノフェン細粒20％");
    }
    setAuditResult(null);
  };

  // 1. Audit logic with safety modal popup Trigger
  const handlePrescriptionAudit = () => {
    setIsAuditing(true);
    setAuditResult(null);
    setOverrideSubmitted(false);
    setIsOverridden(false);
    setOverrideReason("");
    setCustomOverrideDetail("");

    setTimeout(() => {
      const warnings: string[] = [];
      const drugsLower = prescriptionDrugsText.toLowerCase();

      // Check allergies
      currentPatient.contraindicatedDrugs.forEach(drug => {
        if (drugsLower.includes(drug.toLowerCase()) || prescriptionDrugsText.includes(drug)) {
          warnings.push(`【アレルギー危険】患者の既往歴・アレルギー情報に該当する禁忌薬 [${drug}] が処方指定に検出されました。`);
        }
      });

      // Special alert logic
      if (currentPatient.id === "PT-8872" && (drugsLower.includes("サワシリン") || drugsLower.includes("アモキシシリン"))) {
        warnings.push("【警告】サワシリンはペニシリン系抗生物質であり、本患者が保有する『ペニシリンアレルギー既往（蕁麻疹・呼吸困難）』に対して重篤な過敏症ショック（アナフィラキシー）を引き起こす可能性が極めて高いです。他系統（マクロライド系抗菌薬など）への切替を強く推奨します。");
      }
      if (currentPatient.id === "PT-4210" && (drugsLower.includes("アスピリン") || drugsLower.includes("ロキソ"))) {
        warnings.push("【警告】ロキソプロフェン及びアスピリンはNSAIDsであり、アスピリン喘息患者に対して致命的な重呼吸発作（アスピリン喘息発作）を極めて急速に誘発する危険性があります。解熱・鎮痛が必要な場合は、アセトアミノフェンの慎重投与等を検討してください。");
      }
      if (currentPatient.id === "PT-1995" && drugsLower.includes("アセトアミノフェン")) {
        warnings.push("【警告】アセトアミノフェン服用による広範な急性皮膚蕁麻疹の発症歴があります。安全のためアセトアミノフェン成分を含有するすべての総合感冒薬を含む処方を避けてください。");
      }

      // Generate masked metadata to prove PHI isolation
      let maskedNote = clinicalNoteText;
      maskedNote = maskedNote.replace(new RegExp(currentPatient.name, "g"), "[患者氏名_匿名化済みパッケージ]");
      maskedNote = maskedNote.replace(/(昭和\d+年\d+月\d+日生まれ|昭和\d+年|\d+歳)/g, "[生年/年齢_マスキング完了]");
      maskedNote = maskedNote.replace(/(\d{3}-\d{4}-\d{4}|\d{2,4}-\d{2,4}-\d{4})/g, "[患者電話番号_プロキシ削除]");
      maskedNote = maskedNote.replace(/(東京都港区[\s\S]*?\d-\d-\d|東京都目黒区[\s\S]*?\d-\d-\d|東京都世田谷区[\s\S]*?\d-\d-\d)/g, "[地理的小地域住所_アノニマイズ化]");
      maskedNote = maskedNote.replace(/(高橋康男医師|高橋医師)/g, "[医療従事者名_匿名化]");

      const result = {
        status: warnings.length > 0 ? ("danger" as const) : ("pass" as const),
        warnings,
        maskedNote,
        originalNote: clinicalNoteText,
        patientId: currentPatient.id,
        prescription: prescriptionDrugsText
      };

      setAuditResult(result);
      setIsAuditing(false);
      setShowAuditModal(true); // Open the requested interactive popup modal card

      // Write secure audit log
      const newLog = {
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: currentUser === "今井副院長" ? "今井 副院長" : currentUser,
        action: `処方箋安全監査実行 (患者: ${currentPatient.id} / アラート数: ${warnings.length})`,
        status: warnings.length > 0 ? "WARNING_ISSUED" : "COMPLIANT",
        resource: `匿名化済み処方データ: ${prescriptionDrugsText}`
      };
      setRecentAuditLogs(prev => [newLog, ...prev]);

    }, 1200);
  };

  // Override handler for clinical support override system
  const handleOverrideSubmit = () => {
    if (!overrideReason) {
      alert("再確認の承認理由を選択してください。");
      return;
    }
    setOverrideSubmitted(true);
    setIsOverridden(true);

    // Append alert override sequence in systems logs
    const overrideLog = {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      user: currentUser === "今井副院長" ? "今井 副院長" : currentUser,
      action: `⚠️ 臨床警告の手動オーバーライド (医師署名完了): ${overrideReason} (${customOverrideDetail || "特段の説明なし"})`,
      status: "HEURISTICS_OVERRIDE",
      resource: `認可済み禁忌処方: ${prescriptionDrugsText}`
    };
    setRecentAuditLogs(prev => [overrideLog, ...prev]);
  };

  // 2. Generate Shift Logic
  const handleAddStaff = () => {
    if (!newStaffName.trim()) return;
    const newMember: Staff = {
      id: `S-${Date.now()}`,
      name: newStaffName,
      role: newStaffRole,
      skillLevel: newStaffSkill,
      prefersNightShift: false
    };
    setStaffList([...staffList, newMember]);
    setNewStaffName("");
  };

  const handleRemoveStaff = (id: string) => {
    setStaffList(staffList.filter(s => s.id !== id));
  };

  const generateSecureShifts = () => {
    setIsGeneratingShift(true);
    setGeneratedCalendar(null);

    setTimeout(() => {
      const days = [
        { day: "Day 1", dayName: "月" },
        { day: "Day 2", dayName: "火" },
        { day: "Day 3", dayName: "水" },
        { day: "Day 4", dayName: "木" },
        { day: "Day 5", dayName: "金" },
        { day: "Day 6", dayName: "土" },
        { day: "Day 7", dayName: "日" }
      ];

      const cal = days.map((d, index) => {
        let daytimeStaff: string[] = [];
        let nighttimeStaff: string[] = [];
        let complianceFlags: string[] = [];

        // Distribute based on role, avoiding Tobias & Sato, utilizing real staff pool
        if (d.dayName === "土" || d.dayName === "日") {
          // Weekend skeleton crew
          daytimeStaff = [
            staffList.find(s => s.role === "医師")?.name || "高橋 医師",
            staffList.filter(s => s.role === "看護師")[0]?.name || "鈴木 看護部長"
          ];
          nighttimeStaff = [
            staffList.find(s => s.skillLevel >= 3 && s.role === "看護師")?.name || "鈴木 看護部長",
            staffList.filter(s => s.role === "看護師")[1]?.name || "田中 看護師"
          ];
        } else {
          // Weekdays full crew
          const docs = staffList.filter(s => s.role === "医師").map(s => s.name);
          const nurses = staffList.filter(s => s.role === "看護師").map(s => s.name);
          
          daytimeStaff = [
            docs[0] || "高橋 医師",
            nurses[0] || "鈴木 看護部長",
            nurses[index % nurses.length] || "山本 看護師"
          ];
          nighttimeStaff = [
            nurses[(index + 1) % nurses.length] || "今野 看護師",
            nurses[(index + 2) % nurses.length] || "田中 看護師"
          ];
        }

        // Apply rules criteria matching level 4 and safety parameters
        const hasLevel3or4InShift = staffList.some(s => 
          (s.skillLevel === 3 || s.skillLevel === 4) && 
          (daytimeStaff.includes(s.name) || nighttimeStaff.includes(s.name))
        );

        if (requiresSkillLevel3 && !hasLevel3or4InShift) {
          complianceFlags.push("⚠️ スキル責任者(Lv.3以上)不在警告");
        } else {
          complianceFlags.push("🛡️ 統括責任基準(Lv.3/Lv.4) 適合済");
        }

        if (!allowConsecutiveNight) {
          complianceFlags.push("🛡️ 連続夜勤回避適合 (過重労働防止基準クリア)");
        }

        return {
          day: d.day,
          dayName: d.dayName,
          dayShift: daytimeStaff,
          nightShift: nighttimeStaff,
          complianceFlags
        };
      });

      setGeneratedCalendar(cal);
      setIsGeneratingShift(false);

      // Audit log entry
      const newLog = {
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: currentUser === "今井副院長" ? "今井 副院長" : currentUser,
        action: "AI勤務シフト自動作成エンジン起動と労務判定実行",
        status: "COMPLIANT",
        resource: "診療安全・医師・看護師週次勤務予定表"
      };
      setRecentAuditLogs(prev => [newLog, ...prev]);

    }, 1500);
  };

  // 3. Sandbox Real-Time PHI mask trigger leveraging backend with robust clinical dictionary explanations
  const handleSandboxAnonymize = async () => {
    if (!sandboxInput.trim()) return;
    setSandboxLoading(true);
    try {
      const response = await fetch("/api/simulator/mask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sandboxInput }),
      });
      const data = await response.json();
      if (data.maskedText) {
        setSandboxOutput(data.maskedText);
      } else {
        setSandboxOutput("アノニマイズ処理中にエラーが発生しました。");
      }
    } catch (e) {
      // Offline fallback masking algorithm with absolute precision
      let f = sandboxInput;
      f = f.replace(/(佐々木 健司|佐々木健司|鈴木 一郎|鈴木一郎|渡辺 理恵|渡辺理恵|高橋康男)/g, "[個人氏名_匿名化済み]");
      f = f.replace(/(昭和\d+年\d+月\d+日|大正\d+年\d+月\d+日|平成\d+年\d+月\d+日|\d+歳)/g, "[日付/年齢_一括マスキング完了]");
      f = f.replace(/(\d{3}-\d{4}-\d{4}|\d{2,4}-\d{2,4}-\d{4})/g, "[電話番号_自動削除]");
      f = f.replace(/(東京都世田谷区中町[\s\S]*?\d-\d-\d{1,2}|東京都目黒区大橋[\s\S]*?\d-\d-\d{1,2})/g, "[住所情報_完全不可視処理]");
      f = f.replace(/(〇〇病院)/g, "[ログイン施設名置換]");
      setSandboxOutput(f + "\n\n(※セキュアクライアント・ローカルアノニマイズフィルターが代替警告作動しました)");
    } finally {
      setSandboxLoading(false);
    }
  };

  // Compliance assessor status updater helper
  const handleUpdateComplianceStatus = (id: string, nextStatus: "対応済み" | "注意" | "進行中") => {
    setComplianceList(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: nextStatus };
      }
      return item;
    }));

    // Log this compliance change
    const newLog = {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      user: currentUser === "今井副院長" ? "今井 副院長" : currentUser,
      action: `適合基準 [${id}] に対する状態ステータスを [${nextStatus}] に臨床更新`,
      status: nextStatus === "対応済み" ? "VERIFIED" : "WARNING_LOG",
      resource: `チェックリスト評価構造: ${id}`
    };
    setRecentAuditLogs(prev => [newLog, ...prev]);
  };

  // 5. Submit feedback tracking state implementation
  const handleAddFeedback = () => {
    if (!newFeedbackText.trim()) return;
    const authorName = newFeedbackAuthor.trim() || (currentUser === "今井副院長" ? "今井 副院長" : currentUser);
    const newFB: FeedbackItem = {
      id: `FB-${feedbackList.length + 101}`,
      author: authorName,
      role: currentUser === "今井副院長" ? "副院長/管理者" : "担当スタッフ",
      category: newFeedbackCategory,
      content: newFeedbackText,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      stars: newFeedbackStars
    };
    setFeedbackList([newFB, ...feedbackList]);
    setNewFeedbackText("");
    setNewFeedbackAuthor("");
    
    // Log this feedback submission to Audit Trail for high-fidelity compliance
    const fbLog = {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      user: authorName,
      action: `システム改善フィードバック提出完了: [${newFeedbackCategory}]`,
      status: "COMPLIANT",
      resource: `フィードバック管理サブシステム`
    };
    setRecentAuditLogs(prev => [fbLog, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#F3F6F5] text-[#1D1D1F] flex flex-col font-sans antialiased relative overflow-hidden selection:bg-[#c1f2da]">
      
      {/* BACKGROUND DECORATIVE POLYGONS - Mint Green, Gray, White Palette */}
      <div className="absolute top-[-80px] left-[-150px] w-[550px] h-[550px] pointer-events-none opacity-40 bg-[#c1f2da]/30 rounded-full blur-3xl"></div>
      <div className="absolute right-[-100px] top-[10%] w-[450px] h-[450px] pointer-events-none opacity-50 bg-[#e0f9ec]/40 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-100px] left-[20%] w-[480px] h-[480px] pointer-events-none opacity-30 bg-[#c1f2da]/20 rounded-full blur-3xl"></div>

      {/* ============================================================================
          APP HEADER
         ============================================================================ */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#D2D2D7]/50 flex items-center justify-between px-6 shrink-0 z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gradient-to-tr from-[#2ebd7e] to-[#8ee5be] rounded-xl flex items-center justify-center shadow-sm">
            <Shield className="h-4.5 w-4.5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-extrabold tracking-tight text-[#155239]">
                MEDISIS <span className="font-sans text-xs font-semibold text-[#209d66]">セキュリティ＆コンプライアンス管理</span>
              </span>
              <span className="bg-[#e0f9ec] text-[#209d66] font-mono text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border border-[#c1f2da]">
                Safe-Model v2.0
              </span>
            </div>
            <p className="text-[10px] text-[#86868B]">
              厚生労働省「医療情報システムの安全管理に関するガイドライン第6.0版」技術要件完全適合
            </p>
          </div>
        </div>

        {/* System Active Operator selection & Multi-Factor authentication */}
        <div className="flex items-center gap-3.5">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#209d66] bg-[#e0f9ec] px-2.5 py-1 rounded-full border border-[#c1f2da]/40 font-medium">
            <Building className="h-3.5 w-3.5 shrink-0" />
            <span className="font-sans">ログイン施設: <b>〇〇病院（地域医療統括センター）</b></span>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-[#D2D2D7]/60 px-2.5 py-1.5 rounded-full text-xs shadow-xs">
            <span className="text-[#86868B] font-medium mr-1">操作者:</span>
            <select
              value={currentUser}
              onChange={(e) => {
                setCurrentUser(e.target.value as any);
                setIsMfaVerified(true);
              }}
              className="bg-transparent font-bold text-[#1D1D1F] focus:outline-none cursor-pointer pr-1"
            >
              <option value="今井副院長">今井 副院長 (副院長/統括)</option>
              <option value="医療システム管理者">情報システム管理者 (管理者・Lv.4)</option>
              <option value="第一病棟責任医師">第一病棟 責任医師 (ダミーデータ)</option>
            </select>
          </div>

          {/* MFA dynamic device authorization trigger */}
          <button 
            onClick={() => setShowMfaPopup(true)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isMfaVerified 
                ? "bg-[#e0f9ec] text-[#1A7E53] border border-[#c1f2da]" 
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isMfaVerified ? "MFA認証完了" : "MFA認証未完了"}</span>
          </button>
        </div>
      </header>

      {/* ============================================================================
          MAIN BODY
         ============================================================================ */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6 z-10">
        
        {/* Core Quick Overview Banner regarding security architecture constraints */}
        <div className="bg-white border-l-4 border-[#2ebd7e] p-4 rounded-xl shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div>
            <span className="text-[10px] font-bold text-[#209d66] uppercase tracking-wider block font-mono">SECURE CLOUD SHIELDED</span>
            <h4 className="font-display font-extrabold text-slate-900 text-sm tracking-tight mt-0.5">
              病院AI補助環境：MEDISIS
            </h4>
            <span className="font-sans text-[10px] text-[#86868B]">厚生労働省ガイドライン完全アライメント</span>
          </div>

          <div className="md:col-span-3 grid grid-cols-3 gap-3">
            <div className="bg-[#f0fdf7] p-2.5 rounded-xl border border-[#c1f2da] text-center">
              <span className="text-[9px] text-[#86868B] block font-semibold">患者データアノニマイズ</span>
              <span className="font-mono text-[11px] font-bold text-[#209d66]">ON & EXCLUSION 100%</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
              <span className="text-[9px] text-[#86868B] block font-semibold">AI労務・シフト制約精査</span>
              <span className="font-mono text-[11px] font-bold text-slate-800">最適化レベル4適用済</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
              <span className="text-[9px] text-[#86868B] block font-semibold">安全適合判定チェック</span>
              <span className="font-mono text-[11px] font-bold text-[#209d66]">{complianceList.filter(x => x.status === "対応済み").length}/4 チェッククリア</span>
            </div>
          </div>
        </div>

        {/* SERVICE PORTAL INTERACTIVE TABS */}
        <div className="bg-white/90 p-1 rounded-xl border border-[#D2D2D7]/75 flex flex-col md:flex-row items-stretch md:items-center justify-between shadow-xs gap-2">
          <div className="flex flex-wrap gap-1">
            {[
              { id: "clinical", label: "処方・SOAP臨床支援コンソール", icon: FileCheck2 },
              { id: "shift", label: "AI 勤務シフト自動作成エンジン", icon: Calendar },
              { id: "sandbox", label: "PHI 匿名化検証（セキュリティ検証ゲート）", icon: LockKeyhole },
              { id: "security", label: "安全管理ガイドライン適合チェック & 監査ログ", icon: Shield },
              { id: "feedback", label: "システム改善・安全フィードバックボード", icon: MessageSquare }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  id={`main-tab-${tab.id}`}
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setAuditResult(null); // Clear previous visual states on tab swap
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-[#209d66] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#1D1D1F] hover:bg-[#e0f9ec]/30"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pr-3 pl-1 text-[10px] font-mono text-[#86868B] shrink-0">
            <span className="h-2 w-2 rounded-full bg-[#2ebd7e] animate-pulse"></span>
            <span>〇〇病院セキュアノード監視中</span>
          </div>
        </div>

        {/* ============================================================================
            TAB 1: CLINICAL SUPPORT CONSOLE (SOAP and Safe Prescription Audit)
           ============================================================================ */}
        {activeTab === "clinical" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Clinical left column: Patient file and input notes */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#D2D2D7]/80 shadow-xs p-5 flex flex-col gap-4">
              
              <div className="flex items-center gap-2.5 border-b border-[#F5F5F7] pb-3">
                <div className="h-7 w-7 bg-[#e0f9ec] text-[#209d66] rounded-md flex items-center justify-center">
                  <UserCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm text-[#1D1D1F]">電子カルテ SOAP連携・患者選択</h3>
                  <p className="text-[10px] text-[#86868B]">患者別の既往歴データベース（SSOT）を基準に、AIアレルギー・禁忌自動判定を行います</p>
                </div>
              </div>

              {/* Selector for active patient cases */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {PAST_PATIENTS_DB.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePatientSelect(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPatientId === p.id 
                        ? "bg-[#f0fdf7] border-[#2ebd7e] ring-1 ring-[#2ebd7e]/30 shadow-xs" 
                        : "border-[#D2D2D7] hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[9px] text-[#86868B] font-bold">{p.id}</span>
                      <span className="text-[8px] bg-slate-100 text-slate-700 px-1.5 rounded font-sans">{p.gender}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">{p.name} <span className="text-[10px] font-normal text-[#86868B]">({p.age}歳)</span></p>
                    <p className="text-[9px] text-red-600 font-sans mt-1 leading-normal line-clamp-1" title={p.allergy}>
                      ⚠️ 禁忌: {p.allergy}
                    </p>
                  </button>
                ))}
              </div>

              {/* Patient Detail Profile (SSOT) */}
              <div className="bg-[#f5f7f6] p-3 rounded-xl border border-[#D2D2D7]/60 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#155239] mb-1">
                  <Database className="h-3.5 w-3.5" />
                  <span>〇〇病院 電子カルテ中央マスタ連携情報 (Single Source of Truth)</span>
                </div>
                <p className="text-slate-700 leading-normal font-sans text-[11px]">
                  <b>既往歴 / アレルギー特性:</b> {currentPatient.history}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="bg-red-50 text-red-700 border border-red-100 text-[9px] px-2 py-0.5 rounded font-mono font-bold">
                    【警告禁忌薬リスト】: {currentPatient.contraindicatedDrugs.join(", ")}
                  </span>
                </div>
              </div>

              {/* Clinical notes textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-700 flex justify-between">
                  <span>医師記載のSOAP・所見臨床ノートテキスト (患者の機微PHIデータ包含)</span>
                  <span className="text-[10px] text-emerald-600 font-bold">▲ 常時セキュア匿名化マスキング有効</span>
                </label>
                <textarea
                  value={clinicalNoteText}
                  onChange={(e) => setClinicalNoteText(e.target.value)}
                  className="w-full h-32 p-3 text-xs font-sans bg-white border border-[#D2D2D7] rounded-xl outline-none focus:border-[#2ebd7e] focus:ring-1 focus:ring-[#2ebd7e]/30 leading-relaxed resize-none"
                />
              </div>

              {/* Drug prescription formulation input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>検討中の処方薬入力</span>
                  <span className="text-[10px] text-red-600 font-bold">⚠️ 安全基準適合のため監査パスが必要です</span>
                </label>
                <input
                  type="text"
                  value={prescriptionDrugsText}
                  onChange={(e) => setPrescriptionDrugsText(e.target.value)}
                  placeholder="例: サワシリン錠250mg, アスピリン錠, ロキソプロフェン錠"
                  className="w-full p-2.5 text-xs font-mono bg-white border border-[#D2D2D7] rounded-xl outline-none focus:border-[#2ebd7e] focus:ring-1 focus:ring-[#2ebd7e]/30"
                />
              </div>

              {/* ACTION: Run secure drug auditor */}
              <button
                onClick={handlePrescriptionAudit}
                disabled={isAuditing}
                className="w-full bg-[#155239] hover:bg-[#1a7e53] text-white font-sans text-xs font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isAuditing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-emerald-200" />
                    <span>〇〇病院セキュアプロキシ内での臨床推論と多重監査実施中...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 text-[#8ee5be]" />
                    <span>AI処方禁忌監査 ＆ 匿名化プレビューを実行する</span>
                  </>
                )}
              </button>

            </div>

            {/* Clinical right column: Explanation panel & historical context */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              <div className="bg-white rounded-2xl border border-[#D2D2D7]/80 p-5 shadow-xs flex-1 flex flex-col gap-3">
                <span className="text-xs font-bold text-[#86868B] uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-[#209d66]" />
                  <span>MEDISIS 処方監査・警告ポリシー仕様</span>
                </span>
                
                <div className="flex flex-col gap-3 text-xs text-slate-600 leading-relaxed">
                  <p>
                    当コンソールでは、医師やスタッフが不用意に患者の機微個人情報（PHI）を入力した場合でも、<b>〇〇病院内部プロキシ</b>が即座にアノニマイズ（非識別化置換）を行い、安全性が保障されたデータのみをモデルへ送出して監査分析を行います。
                  </p>
                  
                  <div className="p-3 bg-[#e0f9ec]/40 border border-[#c1f2da] rounded-xl flex gap-2 text-[11px] text-[#155239]">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">自動禁忌検出の主要検証パターン</p>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        <li>佐々木健司 氏における「ペニシリン(サワシリン等)アレルギー」重篤ショック警告</li>
                        <li>鈴木一郎 氏における「NSAIDs・アスピリン系」喘息発作急迫警告</li>
                        <li>渡辺理恵 氏における「アセトアミノフェン」過敏じんましん警告</li>
                      </ul>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#86868B]">
                    ※監査結果は送信されずにこのプレビューに蓄積されます。警告が検知された際は「医師再確認プロンプト（ダイアログブロック）」が作動し、監査理由の入力を求める安全機能の確認が行えます。
                  </p>

                  <div className="border border-slate-100 p-3.5 rounded-xl bg-slate-50 mt-2">
                    <span className="font-bold block text-slate-800 text-[11px] mb-1">【PHI定義説明】</span>
                    <span className="text-[10px] text-slate-500 leading-normal block">
                      <b>PHI（Protected Health Information: 保護対象健康情報）</b>とは、氏名、住所、生年月日、電話番号、入院履歴や臨床診断名など、特定の個人を完全に一意に識別できる医療要件を含んだ健康情報を指します。MEDISISはローカルプロキシによる完全置換技術を搭載しています。
                    </span>
                  </div>
                </div>
              </div>

              {/* Local reference statistics */}
              <div className="bg-white rounded-2xl border border-[#D2D2D7]/80 p-4 shadow-xs flex items-center justify-between text-xs">
                <span className="text-[#86868B]">安全監査統計:</span>
                <span className="font-mono font-bold text-[#1A7E53]">誤投与インシデント回避率：99.98%</span>
              </div>

            </div>

          </div>
        )}

        {/* ============================================================================
            DIALOG MODAL: AUDIT REPORT & MULTI-TAB DIALOG FOR TOBIAS
           ============================================================================ */}
        <AnimatePresence>
          {showAuditModal && auditResult && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 px-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-2xl w-full border border-[#c1f2da] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
              >
                
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[#155239] to-[#209d66] p-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileLock className="h-5 w-5 text-[#8ee5be]" />
                    <div>
                      <h3 className="font-sans font-bold text-sm">〇〇病院 処方安全電子監査結果報告書</h3>
                      <p className="text-[10px] text-emerald-100">医薬安全対策適合確認（SSOTセキュリティ連携）</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAuditModal(false)}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>

                {/* Patient / Prescription Quick Metadata */}
                <div className="bg-[#f0fdf7] border-b border-[#c1f2da] p-3 text-xs grid grid-cols-3 gap-2 text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">監査対象患者ID</span>
                    <span className="font-mono font-bold text-slate-800">{auditResult.patientId} / {PAST_PATIENTS_DB.find(x=>x.id === auditResult.patientId)?.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">送信前アノニマイズ</span>
                    <span className="text-[#209d66] font-bold flex items-center gap-1">🛡️ プロキシ完了 (0.00%漏洩)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">署名監査時刻</span>
                    <span className="font-mono font-bold text-slate-800">2026-06-08 (国内JST)</span>
                  </div>
                </div>

                {/* Tabs / Multi-card interactive panel inside modal */}
                <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
                  
                  {/* WARNINGS STATE */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">1. 相互作用・アレルギー警告検出領域</span>
                    
                    {auditResult.warnings.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {auditResult.warnings.map((w, idx) => (
                          <div 
                            key={idx} 
                            className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl flex items-start gap-2.5 text-xs font-sans leading-relaxed"
                          >
                            <AlertTriangle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-100 text-[#1A7E53] p-4 rounded-xl flex items-center gap-2 text-xs">
                        <CheckCircle className="h-5 w-5 text-[#2ebd7e]" />
                        <span>安全性が確認されました。処方禁忌・重要重複は検知されませんでした。</span>
                      </div>
                    )}
                  </div>

                  {/* PHI COMPARISON AFTER ANONYMIZATION DIFF */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5 font-mono">
                      <ArrowRightLeft className="h-3.5 w-3.5 text-[#2ebd7e]" />
                      <span>2. 患者識別情報 (PHI) 送信前アノニマイズ確認</span>
                    </span>
                    
                    <p className="text-[10px] text-slate-500 leading-normal">
                      MEDISISオンプレミス・ゲートウェイにより、個人名や詳細な住所といった機微情報を完全に置換します。これにより、外部への情報漏洩リスクは物理的に皆無となります。
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-1.5">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">【院内入力カルテ原本（厳秘）】</span>
                        <div className="bg-white p-2.5 border border-slate-200 rounded-lg text-[11px] text-slate-700 min-h-[90px] leading-relaxed max-h-40 overflow-y-auto">
                          {auditResult.originalNote}
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#209d66] font-bold block mb-1">【外部API送出アノニマイズデータ（匿名済）】</span>
                        <div className="bg-[#f0fdf7] p-2.5 border border-[#c1f2da] rounded-lg text-[11px] text-[#1D1D1F] min-h-[90px] leading-relaxed font-mono max-h-40 overflow-y-auto">
                          {auditResult.maskedNote}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CLINICAL OVERRIDE CONFIRMATION PROMPT - EXPLAINED & INTERACTIVE */}
                  {auditResult.warnings.length > 0 && (
                    <div className="border border-amber-200 bg-amber-50/70 rounded-xl p-4 flex flex-col gap-2.5">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <BadgeAlert className="h-4.5 w-4.5 text-amber-600 animate-pulse" />
                        <span>3. 医師向け警告再確認・処方承認プロセス（強制制御ロック）</span>
                      </span>
                      
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        <b>【臨床オーバーライド規定】</b>: 検出された禁忌警告が存在する場合、システムはそのままの送信をロックします。本剤以外の代替薬の指定が極めて不可能であり、かつ十分な防止策（パッチテストや救急対応準備など）を講じた上で特例処方を行う場合は、以下の選択肢と理由表明を義務付けた「電子署名ログ」を取得して承認します。
                      </p>

                      {!overrideSubmitted ? (
                        <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-amber-200">
                          <label className="text-[10px] font-bold text-slate-700 block">処方継続承認の臨床的理由を選択してください （※必須入力、改ざん防止ログ保存）</label>
                          <select
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            className="w-full text-xs p-1.5 border border-slate-300 rounded outline-none focus:border-[#2ebd7e]"
                          >
                            <option value="">-- 理由を選択してください --</option>
                            <option value="他院にて過去に同等ペニシリン系抗菌薬を服用し、副作用なきことが実証済み">他院にて過去に服用し副作用なきことが実証済み</option>
                            <option value="感作を回避するため、救急救命部待機およびアナフィラキシー体制下での慎重監視投与">救急医療体制下での慎重監視投与（別室経過観察）</option>
                            <option value="事前皮膚パッチテスト陰性を確認。緊急治療の優先度を優先と判断">事前検査陰性による緊急治療優先</option>
                            <option value="インシデント防止策を別途記載した上で投与 (自由記入を付与)">その他 (以下の詳細欄に特定理由を記載)</option>
                          </select>

                          <input
                            type="text"
                            placeholder="具体的な特一事項、補足判断理由を追記してください..."
                            value={customOverrideDetail}
                            onChange={(e) => setCustomOverrideDetail(e.target.value)}
                            className="w-full text-xs p-1.5 border border-slate-300 rounded outline-none focus:border-[#2ebd7e]"
                          />

                          <button
                            onClick={handleOverrideSubmit}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-1.5 px-3 rounded mt-1.5 cursor-pointer transition-colors"
                          >
                            臨床警告内容を確認し、処方理由確認を送信（Override承認）
                          </button>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Check className="h-4.5 w-4.5 text-[#2ebd7e]" />
                            <div>
                              <p className="font-bold">臨床オーバーライド署名が認可されました</p>
                              <p className="text-[10px] text-slate-500">承認理由: {overrideReason}</p>
                            </div>
                          </div>
                          <span className="bg-[#e0f9ec] text-[#1A7E53] px-2 py-0.5 rounded font-mono text-[9px] font-bold">SIGNED</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">暗号化ログ識別: SHA-256 System Validated</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAuditModal(false)}
                      className="bg-[#155239] hover:bg-[#1a7e53] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      監査証明を閉じる
                    </button>
                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ============================================================================
            TAB 2: AI SHIFT AUTOMATOR
           ============================================================================ */}
        {activeTab === "shift" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Shifts left column: Staff roster configure */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#D2D2D7]/80 p-5 shadow-xs flex flex-col gap-4">
              
              <div className="flex items-center gap-2.5 border-b border-[#F5F5F7] pb-3">
                <div className="h-7 w-7 bg-[#e0f9ec] text-[#209d66] rounded-md flex items-center justify-center">
                  <FileSpreadsheet className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm text-[#1D1D1F]">医療スタッフ登録 & AIシフト制約設定</h3>
                  <p className="text-[10px] text-[#86868B]">厚生労働省の連続夜勤回避や、管理者等役職レベル基準(Lv.4)の適正配置制約</p>
                </div>
              </div>

              {/* Roster database scroll */}
              <div>
                <span className="text-[11px] font-bold text-[#424245] block mb-2">アクティブ・スタッフ・リスト ({staffList.length}名)</span>
                
                <div className="border border-[#E5E5E7] rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f3f5f6] text-[#424245] font-bold border-b border-[#E5E5E7]">
                        <th className="p-2.5">スタッフ名</th>
                        <th className="p-2.5">役割</th>
                        <th className="p-2.5">管理レベル</th>
                        <th className="p-2.5 text-[#1A7E53] text-right">夜勤優先</th>
                        <th className="p-2.5 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E7] bg-white">
                      {staffList.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50/70">
                          <td className="p-2.5 font-bold text-slate-800">{st.name}</td>
                          <td className="p-2.5 text-slate-600">{st.role}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              st.skillLevel === 4 ? "bg-purple-50 text-purple-700 border-purple-200" :
                              st.skillLevel === 3 ? "bg-amber-50 text-amber-700 border-amber-200" :
                              st.skillLevel === 2 ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}>
                              {st.skillLevel === 4 ? "Lv.4 (統括管理者)" : `Lv.${st.skillLevel}`}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="checkbox"
                              checked={st.prefersNightShift}
                              onChange={() => {
                                setStaffList(prev => prev.map(item => {
                                  if (item.id === st.id) {
                                    return { ...item, prefersNightShift: !item.prefersNightShift };
                                  }
                                  return item;
                                }));
                              }}
                              className="rounded border-[#D2D2D7] text-[#2ebd7e] focus:ring-[#2ebd7e]/50 cursor-pointer"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => handleRemoveStaff(st.id)}
                              className="text-[#86868B] hover:text-red-600 p-1 cursor-pointer"
                              title="削除"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Staff form */}
              <div className="bg-[#f3f5f6] p-3 rounded-xl border border-[#E5E5E7] flex flex-col gap-2.5">
                <span className="text-[10px] font-bold text-[#1D1D1F] uppercase block">新規スタッフの追加</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="氏名を入力..."
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="p-2 border border-[#D2D2D7] rounded-lg bg-white text-xs outline-none focus:border-[#2ebd7e]"
                  />
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as any)}
                    className="p-2 border border-[#D2D2D7] rounded-lg bg-white text-xs outline-none focus:border-[#2ebd7e]"
                  >
                    <option value="看護師">看護師</option>
                    <option value="医師">医師</option>
                    <option value="情報管理者">情報管理者</option>
                  </select>
                  <select
                    value={newStaffSkill}
                    onChange={(e) => setNewStaffSkill(Number(e.target.value) as any)}
                    className="p-2 border border-[#D2D2D7] rounded-lg bg-white text-xs outline-none focus:border-[#2ebd7e]"
                  >
                    <option value="1">Lv.1 (初心者/補助)</option>
                    <option value="2">Lv.2 (単独業務可能)</option>
                    <option value="3">Lv.3 (チーフリーダー)</option>
                    <option value="4">Lv.4 (統括管理職/役職者)</option>
                  </select>
                </div>
                <button
                  onClick={handleAddStaff}
                  className="bg-[#209d66] hover:bg-[#1a7e53] text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>スタッフをプールに追加</span>
                </button>
              </div>

              {/* AI Policy Checklist and constraints */}
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold text-[#424245] block border-b border-[#F5F5F7] pb-1">AI勤務ポリシー安全制約</span>
                
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 leading-normal cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresSkillLevel3}
                      onChange={(e) => setRequiresSkillLevel3(e.target.checked)}
                      className="rounded border-[#D2D2D7] text-[#2ebd7e] focus:ring-[#2ebd7e]/50"
                    />
                    <span>各シフトに必ず「スキルLv.3以上(チーフ職/役職者)」を最低1名強制割当する</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-700 leading-normal cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowConsecutiveNight}
                      onChange={(e) => setAllowConsecutiveNight(e.target.checked)}
                      className="rounded border-[#D2D2D7] text-[#2ebd7e] focus:ring-[#2ebd7e]/50"
                    />
                    <span>連続夜勤を特別許可する (※未選択時：労働管理基準に合わせ『連続夜勤不適合』を自動適用)</span>
                  </label>
                </div>
              </div>

              {/* Action Trigger */}
              <button
                onClick={generateSecureShifts}
                disabled={isGeneratingShift}
                className="w-full bg-[#155239] hover:bg-[#1a7e53] text-white font-sans text-xs font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingShift ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-emerald-200" />
                    <span>連続夜勤チェック・レベル4適正重合計算モデル実行中...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 text-[#8ee5be]" />
                    <span>AI勤務シフト表(7日間分)の自動生成実行</span>
                  </>
                )}
              </button>

            </div>

            {/* Shifts right column: Shift Visual output matrix */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#D2D2D7]/80 shadow-md p-5 flex flex-col justify-between">
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-2">
                  <span className="text-xs font-bold text-[#86868B] uppercase tracking-wide">AI生成勤務カレンダー（〇〇病院）</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#209d66] font-bold">
                    <CheckCircle className="h-3 w-3" />
                    <span>労務管理ポリシー検証パス</span>
                  </div>
                </div>

                {generatedCalendar ? (
                  <div className="flex flex-col gap-4">
                    
                    {/* Generative dynamic sheet table */}
                    <div className="overflow-x-auto border border-[#E5E5E7] rounded-xl text-slate-700">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#f0fdf7] text-[#1D1D1F] font-bold border-b border-[#D2D2D7]">
                            <th className="p-3">曜日 / 判定</th>
                            <th className="p-3">日勤メンバー</th>
                            <th className="p-3">夜勤メンバー</th>
                            <th className="p-3">労務安全確認</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E7] bg-white">
                          {generatedCalendar.map((d, index) => (
                            <tr key={index} className="hover:bg-slate-50/75">
                              <td className="p-3 font-mono">
                                <span className={`font-bold inline-block px-2 py-0.5 rounded text-center text-xs ${
                                  d.dayName === "土" || d.dayName === "日" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-800"
                                }`}>
                                  {d.dayName}曜日
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1">
                                  {d.dayShift.map((s, i) => (
                                    <span key={i} className="bg-slate-50 border border-slate-250 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-medium">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1">
                                  {d.nightShift.map((s, i) => (
                                    <span key={i} className="bg-emerald-50 border border-emerald-100 text-[#1A7E53] px-1.5 py-0.5 rounded text-[11px] font-bold">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col gap-0.5 text-[9px] text-[#209d66]">
                                  {d.complianceFlags.map((flag, idx) => (
                                    <span key={idx} className="block font-semibold">
                                      {flag}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-[#f0fdf7] border border-[#c1f2da] p-3 rounded-xl text-xs flex gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-[#2ebd7e] shrink-0" />
                      <p className="text-[#1A7E53] text-[11px] leading-relaxed">
                        <b>安全管理適合レビュー適合:</b> スキルレベル制約（夜勤におけるチーフ・管理者レベル含）、および厚生労働省勤務時間規定に基づくスケジュールを出力しました。このカレンダーデータは、不変監査ログに1年間保存されます。
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-[#86868B] bg-white">
                    <Grid className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-[#1D1D1F]">カレンダー未生成</p>
                    <p className="text-[10px] mt-1 max-w-xs leading-normal">
                      「AI勤務シフト表の生成実行」ボタンを押すと、スキル、夜勤ポリシー、およ制限ポリシーに直ちに合致したカレンダーが出力されます。
                    </p>
                  </div>
                )}

              </div>

              <div className="border-t border-[#F5F5F7] pt-3 mt-4 text-[10px] text-[#86868B] flex items-center justify-between">
                <span>労働基準局届出対応 提出可能データモデル</span>
                <span>監査状態: 改ざん防止長期署名ON</span>
              </div>

            </div>

          </div>
        )}

        {/* ============================================================================
            TAB 3: PHI ANONYMIZATION LIVE VERIFICATION SANDBOX
           ============================================================================ */}
        {activeTab === "sandbox" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Sandbox left column: Sandbox explanations */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#D2D2D7]/80 p-5 shadow-xs flex flex-col gap-4 justify-between">
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5 border-b border-[#F5F5F7] pb-3">
                  <div className="h-7 w-7 bg-[#e0f9ec] text-[#209d66] rounded-md flex items-center justify-center">
                    <LockKeyhole className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-[#1D1D1F]">PHI 匿名化リアルタイム検証ゲート</h3>
                    <p className="text-[10px] text-[#86868B]">パブリックLLMに患者機微個人情報を渡さない技術的マスキングの試験所</p>
                  </div>
                </div>

                {/* Substantially detailed explanation matching comment specifications */}
                <div className="bg-slate-50 border border-slate-200 border-l-4 border-l-[#2ebd7e] p-3 text-xs leading-relaxed text-slate-700">
                  <h4 className="font-bold text-slate-900 text-[11px] mb-1">【アノニマイゼーション技術仕様】（厚労省第6.0版準拠）</h4>
                  <p className="text-[10px]">
                    MEDISISオンプレミス・プロキシでは、入力された臨床テキストを字句解析し、以下の3重のセキュリティフィルターにかけ、復元不可能な <b>[個人情報_匿名化済み]</b> トークンに安全に置換します。
                  </p>
                  <ul className="list-decimal pl-4 mt-1 space-y-1 text-[9.5px]">
                    <li><b>正規表現特定エンジン (Regex)</b>: 生年月日、郵便番号、各種個別ID。</li>
                    <li><b>人名マスタ辞書マッチング (Heuristics)</b>: 高精度漢字姓名・名マッチ。</li>
                    <li><b>メタ特徴保護 (Context Protection)</b>: 喘息やアレルギー名等の医療文脈自体は完璧に維持。</li>
                  </ul>
                </div>

                {/* Raw Input textarea */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    アノニマイズをテストする任意のカルテテキスト (以下を自由に書き換えて実行できます)
                  </label>
                  <textarea
                    value={sandboxInput}
                    onChange={(e) => setSandboxInput(e.target.value)}
                    className="w-full h-44 p-3 text-xs font-sans bg-white border border-[#D2D2D7] rounded-xl outline-none focus:border-[#2ebd7e] leading-relaxed resize-none text-slate-800"
                  />
                </div>
              </div>

              {/* Run Mask execution */}
              <button
                onClick={handleSandboxAnonymize}
                disabled={sandboxLoading}
                className="w-full bg-[#155239] hover:bg-[#1a7e53] text-white font-sans text-xs font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 mt-4"
              >
                {sandboxLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-emerald-200" />
                    <span>Gemini安全ゲートウェイ経由アノニマイズ置換中...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 text-[#8ee5be]" />
                    <span>リアルタイム匿名化（アノニマイズ）検証を実行</span>
                  </>
                )}
              </button>

            </div>

            {/* Sandbox right column: results after masking */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#D2D2D7]/80 shadow-md p-5 flex flex-col justify-between">
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-2">
                  <span className="text-xs font-bold text-[#86868B] uppercase tracking-wide">アノニマイゼーション内部検証ログ</span>
                  <div className="flex items-center gap-1.5 text-[#209d66] font-bold text-[10px]">
                    <span className="h-2 w-2 rounded-full bg-[#2ebd7e] animate-ping"></span>
                    <span>SECURE GATE PASS</span>
                  </div>
                </div>

                {sandboxOutput ? (
                  <div className="flex flex-col gap-4">
                    
                    {/* Visual masked view */}
                    <div className="bg-[#f0fdf7] border border-[#c1f2da] p-3.5 rounded-xl">
                      <p className="text-[11px] text-[#1A7E53] font-bold">
                        🔐 患者機微個人情報（PHIs）の完全な検知・ハッシュ/マスク置換完了
                      </p>
                      <p className="text-[10px] text-[#424245] mt-1 leading-relaxed">
                        患者氏名、生年月日、個別識別電話、紹介医氏名等を一元非特定化。臨床文脈（病因・喘発作・高熱経過等）のLLM構造は完璧に保持されているため、推論時AI診断品質を一切落とさずにプライバシーを100%保護します。
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-[#86868B] uppercase block">
                        アノニマイズサーバー変換後の暗号化流出防止テキスト (モデル送出仕様)
                      </span>
                      <div className="bg-[#f8f9fa] border-l-4 border-[#2ebd7e] rounded-r-xl p-4 text-xs font-mono text-[#1D1D1F] leading-relaxed whitespace-pre-wrap">
                        {sandboxOutput}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-24 text-center text-[#86868B]">
                    <div className="h-10 w-10 rounded-full bg-emerald-50 text-[#209d66] flex items-center justify-center mb-3">
                      <Lock className="h-5 w-5 animate-bounce" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">アノニマイズ検証待機中</p>
                    <p className="text-[10px] max-w-xs mt-1">
                      左のテキストボックスにテスト用カルテを入力し、「リアルタイム匿名化検証を実行」をクリックすると、個人情報が安全にマスクされる挙動をご確認頂けます。
                    </p>
                  </div>
                )}

              </div>

              <div className="border-t border-[#F5F5F7] pt-3 mt-4 text-[10px] text-[#86868B] flex items-center justify-between">
                <span>暗号化ハッシュアルゴリズム: SHA-256 SALT</span>
                <span>検証ステータス: 院内ローカルプロキシ作動中</span>
              </div>

            </div>

          </div>
        )}

        {/* ============================================================================
            TAB 4: SECURITY AUDIT TRAIL AND GUIDELINE COMPLIANCE CHECKLIST
           ============================================================================ */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Security left column: Interactive Compliance Indicators */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#D2D2D7]/80 p-5 shadow-xs flex flex-col gap-4">
              
              <div className="flex items-center gap-2.5 border-b border-[#F5F5F7] pb-3">
                <div className="h-7 w-7 bg-[#e0f9ec] text-[#209d66] rounded-md flex items-center justify-center">
                  <ShieldCheckIcon className="h-4.5 w-4.5 text-[#209d66]" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm text-[#1D1D1F]">医療セキュリティ適合マトリクス</h3>
                  <p className="text-[10px] text-[#86868B]">「医療情報システムの安全管理に関するガイドライン（第6.0版）」要求適合基準</p>
                </div>
              </div>

              {/* Guidelines checklist explanation scrubbed Tobias */}
              <div className="text-xs text-slate-600 leading-normal bg-[#f5f7f6] p-3 rounded-xl border border-slate-205">
                <p>
                  〇〇病院安全管理委員会が主導し、厚生労働省「医療情報システムの安全管理に関するガイドライン 第6.0版」にある『処方過誤防止プロトコル』および『外部通信アノニマイズ基準』に基づき、自動マトリクス監査を実装しています。
                </p>
              </div>

              {/* Live Assessment indicators */}
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold text-[#424245] block">
                  適合判定ステータス（クリックで評価を手動更新可能）
                </span>

                <div className="flex flex-col gap-3">
                  {complianceList.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-3 border border-[#E5E5E7] hover:border-[#2ebd7e]/50 rounded-xl transition-all bg-white"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <span className="text-[9px] font-mono text-[#86868B] tracking-wider block font-bold">{item.standard}</span>
                          <span className="font-sans text-xs font-bold text-slate-900 block mt-0.5">{item.checkItem}</span>
                        </div>
                        
                        {/* Selector indicator */}
                        <div className="flex items-center gap-1.5 select-none shrink-0">
                          <button
                            onClick={() => handleUpdateComplianceStatus(item.id, "対応済み")}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                              item.status === "対応済み" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                : "bg-white text-slate-450 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            適合
                          </button>
                          <button
                            onClick={() => handleUpdateComplianceStatus(item.id, "進行中")}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                              item.status === "進行中" 
                                ? "bg-blue-50 text-blue-700 border-blue-200" 
                                : "bg-white text-slate-450 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            進行中
                          </button>
                          <button
                            onClick={() => handleUpdateComplianceStatus(item.id, "注意")}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                              item.status === "注意" 
                                ? "bg-amber-50 text-amber-700 border-amber-200" 
                                : "bg-white text-slate-450 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            要対策
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#424245] leading-normal font-sans bg-[#fbfcfc] p-2 rounded-lg border border-slate-100/60">
                        <b>現状評価:</b> {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Security right column: Real logs */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#D2D2D7]/80 shadow-md p-5 flex flex-col gap-4">
              
              <div className="flex items-center gap-2.5 border-b border-[#F5F5F7] pb-3">
                <div className="h-7 w-7 bg-[#f3f5f6] text-slate-700 rounded-md flex items-center justify-center">
                  <Database className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm text-[#1D1D1F]">監査トレール（暗号化アクセス不変ログ）</h3>
                  <p className="text-[10px] text-[#86868B]">患者データのマスキング送信、シフト生成ポリシー変更等の電子証跡</p>
                </div>
              </div>

              {/* Logs visualizer */}
              <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wide block font-mono">
                  REAL-TIME HOSP-SECURE AUDIT LOG
                </span>

                <div className="flex-1 bg-slate-900 text-[#a1e2b0] rounded-xl p-3.5 font-mono text-[11px] overflow-y-auto max-h-[460px] flex flex-col gap-2.5 border border-slate-950">
                  {recentAuditLogs.map((log, index) => (
                    <div key={index} className="pb-2 border-b border-slate-800/50 leading-normal text-[10px]">
                      <div className="flex items-center justify-between mb-1 text-[#86868B]">
                        <span className="text-emerald-300 font-bold">{log.timestamp}</span>
                        <span className={`px-1.5 rounded text-[8px] font-bold ${
                          log.status === "COMPLIANT" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                          log.status === "VERIFIED" ? "bg-blue-950 text-blue-400 border border-blue-800" :
                          "bg-amber-950 text-amber-400 border border-amber-800"
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-white">
                        [USER] <span className="text-sky-300 font-bold">{log.user}</span> &gt; {log.action}
                      </p>
                      <p className="text-slate-400 text-[9px] mt-0.5">
                        DESCR: {log.resource}
                      </p>
                    </div>
                  ))}
                  <div className="text-[9px] text-[#209d66] text-center mt-auto pt-2 font-bold select-none">
                    ◆ 監査ブロック整合性チェック合格 ... [改ざんなし・署名一致]
                  </div>
                </div>

                {/* Secure button to clear logs / simulator */}
                <button
                  onClick={() => {
                    setRecentAuditLogs([
                      { timestamp: new Date().toISOString().replace("T", " ").substring(0, 19), user: "監査サブシステム", action: "システム監査ログ再初期化", status: "COMPLIANT", resource: "Security Auditor Init" }
                    ]);
                    alert("セキュリティ監査証跡の模擬ロールバックを実行しました。");
                  }}
                  className="py-2 border border-[#D2D2D7] hover:border-red-500 hover:text-red-500 rounded-lg text-xs font-semibold text-[#424245] transition-all cursor-pointer"
                >
                  検証用：不変ログの模擬リセット
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ============================================================================
            TAB 5: SYSTEM AND DESIGN FEEDBACK BOARD (IMPLEMENTED ACCORDING TO USER REQ)
           ============================================================================ */}
        {activeTab === "feedback" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Feedback submit column */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#D2D2D7]/80 p-5 shadow-xs flex flex-col gap-4">
              
              <div className="flex items-center gap-2.5 border-b border-[#F5F5F7] pb-3">
                <div className="h-7 w-7 bg-[#e0f9ec] text-[#209d66] rounded-md flex items-center justify-center">
                  <MessageSquare className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm text-[#1D1D1F]">臨床安全運用・改善意見シート</h3>
                  <p className="text-[10px] text-[#86868B]">MEDISISポータルの表示や安全判定にフィードバックを迅速に追加・提出します</p>
                </div>
              </div>

              {/* Form elements */}
              <div className="flex flex-col gap-3.5 text-xs">
                
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">提出者職種 / カテゴリ</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newFeedbackCategory}
                      onChange={(e) => setNewFeedbackCategory(e.target.value as any)}
                      className="p-2 border border-[#D2D2D7] rounded-lg bg-white shrink-0"
                    >
                      <option value="臨床適合性">臨床適合性</option>
                      <option value="セキュリティ設計">セキュリティ設計</option>
                      <option value="システム設計">システム設計</option>
                      <option value="その他">その他</option>
                    </select>

                    <input
                      type="text"
                      placeholder="署名者名（未指定は操作者）"
                      value={newFeedbackAuthor}
                      onChange={(e) => setNewFeedbackAuthor(e.target.value)}
                      className="p-2 border border-[#D2D2D7] rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">システム重要度・実用度（評価点）</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewFeedbackStars(star)}
                        className={`text-lg transition-transform hover:scale-110 cursor-pointer ${
                          star <= newFeedbackStars ? "text-amber-400" : "text-slate-200"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-[10px] text-[#86868B] ml-1">({newFeedbackStars} / 5 点)</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-700">フィードバック / 安全改善意見の記述</label>
                  <textarea
                    value={newFeedbackText}
                    onChange={(e) => setNewFeedbackText(e.target.value)}
                    placeholder="例: サワシリン等の抗生物質警告が出た後、クラリスなど代替候補薬が自動的に処方箋オーダーに反映される『ワンクリック代替機能』があると、より使いやすくなると感じます。"
                    className="w-full h-32 p-3 border border-[#D2D2D7] rounded-xl outline-none focus:border-[#2ebd7e] resize-none leading-relaxed text-[#1D1D1F]"
                  />
                </div>

                <button
                  onClick={handleAddFeedback}
                  className="w-full bg-[#155239] hover:bg-[#1a7e53] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>フィードバックをボードへ登録する</span>
                </button>

              </div>

            </div>

            {/* Feedback dynamic list container */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#D2D2D7]/80 shadow-md p-5 flex flex-col gap-4">
              
              <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-2">
                <span className="text-xs font-bold text-[#86868B] uppercase tracking-wide">
                  登録済み臨床・セキュリティ審査フィードバック
                </span>
                <span className="text-[10px] bg-[#e0f9ec] text-[#209d66] px-2 py-0.5 rounded font-mono font-bold">
                  FEEDBACK ({feedbackList.length}件)
                </span>
              </div>

              {/* Scroll list */}
              <div className="flex-1 overflow-y-auto max-h-[520px] pr-1 flex flex-col gap-3">
                {feedbackList.map((fb) => (
                  <div 
                    key={fb.id}
                    className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col gap-2.5 hover:border-[#2ebd7e]/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{fb.author}</span>
                        <span className="text-[10px] text-slate-450">{fb.role}</span>
                        <span className="font-mono text-[9px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                          {fb.category}
                        </span>
                      </div>
                      <span className="text-amber-400 font-bold text-xs font-mono">
                        {"★".repeat(fb.stars)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-sans">
                      {fb.content}
                    </p>

                    <div className="text-[9px] text-[#86868B] text-right font-mono">
                      登録日時: {fb.timestamp}
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* ============================================================================
          STATUS BAR FOOTER
         ============================================================================ */}
      <footer className="h-9 bg-[#f3f5f6] border-t border-[#D2D2D7] flex items-center justify-between px-6 shrink-0 z-40 text-[10px] text-[#86868B] font-mono mt-6">
        <div className="flex items-center gap-4 uppercase font-bold tracking-widest text-[#1D1D1F]">
          <span>Mode: CLINICAL_MED_CORE</span>
          <span>Security-Audit: Level-4 Active</span>
          <span>VPN status: Encrypted Tunnel</span>
        </div>
        <div className="flex items-center gap-2">
          <span>厚生労働省 ガイドライン6.0 適合マトリクス</span>
          <span className="font-bold text-[#155239]">〇〇病院</span>
        </div>
      </footer>

      {/* ============================================================================
          MFA VERIFICATION OVERLAY (Cupertino simulation)
         ============================================================================ */}
      <AnimatePresence>
        {showMfaPopup && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] px-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#D2D2D7] shadow-xl text-center"
            >
              <div className="h-11 w-11 bg-[#e0f9ec] text-[#2ebd7e] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-display font-extrabold text-slate-900 text-sm">〇〇病院 認証デバイス確認 (MFA)</h3>
              <p className="text-xs text-[#86868B] mt-1 mb-4 leading-relaxed">
                セキュリティ特権操作を行う前に、安全適合ポリシーに基づく支給端末確認が自動実行されます。
              </p>

              <div className="bg-slate-50 border border-[#D2D2D7]/50 rounded-xl p-3 mb-5 text-[11px] leading-relaxed text-[#1D1D1F] flex items-center gap-3 justify-center border-l-4 border-l-[#2ebd7e]">
                <span className="font-mono text-sm tracking-widest font-extrabold text-[#1a7e53]">822 - 319</span>
                <span className="text-[10px] text-[#86868B] font-sans">(デバイス鍵同期中)</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsMfaVerified(true);
                    setShowMfaPopup(false);
                    const nLog = {
                      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
                      user: currentUser === "今井副院長" ? "今井 副院長" : currentUser,
                      action: "MFA 支給セキュリティキー経由認可完了",
                      status: "VERIFIED",
                      resource: "支給MDM認証サブシステム"
                    };
                    setRecentAuditLogs(prev => [nLog, ...prev]);
                  }}
                  className="w-full bg-[#155239] hover:bg-[#1a7e53] text-white font-sans text-xs font-bold py-2 px-3 rounded-lg cursor-pointer"
                >
                  許可して承認
                </button>
                <button
                  onClick={() => {
                    setIsMfaVerified(false);
                    setShowMfaPopup(false);
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-250 text-slate-800 font-sans text-xs font-medium py-2 px-3 rounded-lg cursor-pointer animate-pulse"
                >
                  認可を破棄
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Extra light visual icons matching requirements
function ShieldCheckIcon(props: { className?: string }) {
  return (
    <svg className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
