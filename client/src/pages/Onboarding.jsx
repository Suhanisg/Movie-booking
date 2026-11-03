import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { EVENT } from "../config/event";

// ---- Yahan se naam aur messages badal sakte ho ----
const ORGANIZER = "Matra Shakti";
// ---------------------------------------------------

const PAD = 8; // highlight ke aas-paas khali jagah (px)

// target = page par data-tour="..." wala hissa jo highlight hoga
// last: true = aakhri step, us hisse par click ho to tour band ho jata hai

// ---------- Landing page ka tour ----------
export const LANDING_TOUR = {
  key: "dd_onboarding_done",
  steps: [
    {
      id: "welcome",
      title: "Namaste! 🙏",
      text: `${ORGANIZER} ki taraf se ${EVENT.movieName} ki booking mein aapka hardik swagat hai.\n\nAaiye, seat book karna kuch hi kadam mein samjha dete hain. Agar aapko instructions nahi chahiye, to Skip kar dijiye.`,
    },
    {
      id: "how",
      title: "Booking sirf 3 kadam mein",
      list: [
        "Apni pasand ki seat chuniye",
        "Har seat ke liye guest ka naam aur mobile number likhiye",
        "Ticket download karke apne phone mein rakh lijiye",
      ],
      text: "Seat chunne ke baad details bharne ke liye kuch hi minute milte hain, isliye thoda jaldi kijiye.",
    },
    {
      id: "details",
      target: "details",
      title: "Show ki jaankari",
      text: "Yahan film ki date, samay aur jagah likhi hai. Ek baar dekh lijiye.",
    },
    {
      id: "stats",
      target: "stats",
      title: "Seats ka haal",
      text: "Yahan dikhta hai ki kul kitni seats hain, kitni khaali (Available) hain aur kitni book ho chuki hain.",
    },
    {
      id: "book",
      target: "book",
      last: true,
      title: "Ab seats chuniye",
      text: "Aage badhne ke liye is button par click kijiye. Uske baad aap apni pasand ki seat chun sakti hain.",
    },
  ],
};

// ---------- Seat selection page ka tour ----------
export const SEAT_TOUR = {
  key: "dd_seat_tour_done",
  steps: [
    {
      id: "intro",
      title: "Ab apni seat chuniye",
      text: "Yahan aap apni pasand ki seat chun sakti hain. Chaliye, ek minute mein samajh lete hain.",
    },
    {
      id: "counts",
      target: "counts",
      title: "Seats ka hisaab",
      text: "Upar dikhta hai ki kul kitni seats hain, kitni khaali hain, kitni book ho chuki hain, aur aapne abhi kitni chuni hain.",
    },
    {
      id: "map",
      target: "map",
      title: "Hall ka naksha",
      text: "Ye hall ka naksha hai. Har chhota dabba ek seat hai aur uske andar seat ka number likha hai. Parda (screen) sabse neeche hai.\n\nSeats chhoti dikhein to + button se bada kar lijiye, phir left-right scroll kijiye.",
    },
    {
      id: "legend",
      target: "legend",
      title: "Rangon ka matlab",
      text: "Hari border wali seat khaali hai. Neeli seat aapne chuni hai. Laal seat book ho chuki hai. Bhoori seat kisi aur ne abhi thodi der ke liye roki hui hai, wo jaldi khaali ho sakti hai.",
    },
    {
      id: "bar",
      target: "bar",
      title: "Aapki chuni hui seats",
      text: "Jo seats aap chunengi, unke number yahan dikhenge. Ek saath kai seats chun sakti hain (10 tak). Seat pakki ho jaye to Continue dabaiye.",
    },
    {
      id: "map-tap",
      target: "map",
      last: true,
      title: "Ab seat par tap kijiye",
      text: "Apni pasand ki khaali seat par tap kijiye. Dobara tap karne par wo hat jayegi.",
    },
  ],
};

// ---------- Guest details page ka tour ----------
export const DETAILS_TOUR = {
  key: "dd_details_tour_done",
  steps: [
    {
      id: "intro",
      title: "Bas ek kadam aur!",
      text: "Aapki seats aapke liye rok li gayi hain. Ab har seat ke liye guest ki details bharni hain. Chaliye, jaldi se samajh lete hain.",
    },
    {
      id: "timer",
      target: "timer",
      title: "Ye ghadi dekhiye",
      text: "Ye dikhati hai ki aapki seats kitni der aapke liye roki hui hain. Time khatam hone se pehle booking pakki kar lijiye, warna seats chhoot jayengi.",
    },
    {
      id: "bar",
      target: "bar",
      title: "Aapki seats",
      text: "Yahan aapki chuni hui seats ke number dikhte hain. Saari details bhar dene ke baad yahin se Confirm Booking dabaiye.",
    },
    {
      id: "guest",
      target: "guest",
      last: true,
      title: "Naam aur mobile number bhariye",
      text: "Seat ke saamne jis vyakti ki seat hai, uska poora naam likhiye. Mobile number 10 digit ka sahi number ho, behtar hai ki WhatsApp wala number dein.\n\nHar seat ke liye alag mobile number chahiye, ek number sirf ek seat par chalega.",
    },
  ],
};

export function hasSeenTour(tour) {
  try {
    return localStorage.getItem(tour.key) === "1";
  } catch {
    return false;
  }
}

function markTourDone(tour) {
  try {
    localStorage.setItem(tour.key, "1");
  } catch {
    // storage band ho to bhi koi dikkat nahi
  }
}

export default function Onboarding({ tour, onClose }) {
  const [steps, setSteps] = useState(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [cardH, setCardH] = useState(250);
  const cardRef = useRef(null);

  // onClose har render par naya ban sakta hai, isliye ref mein rakha
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Jo hissa page par nahi hai (jaise booking band ho to button) wo step hata do
  useEffect(() => {
    setSteps(
      tour.steps.filter(
        (s) => !s.target || document.querySelector(`[data-tour="${s.target}"]`)
      )
    );
  }, [tour]);

  const step = steps ? steps[index] : null;
  const isLast = Boolean(steps) && index === steps.length - 1;

  const finish = useCallback(() => {
    markTourDone(tour);
    onCloseRef.current();
  }, [tour]);

  // Last step dikhte hi "dekh liya" maan lo, taaki baar-baar na aaye
  useEffect(() => {
    if (isLast) markTourDone(tour);
  }, [isLast, tour]);

  // Esc dabane par skip
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  // Target tak scroll karo aur uski jagah track karte raho
  useEffect(() => {
    if (!step || !step.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) return;

    el.scrollIntoView({ block: "center", behavior: "smooth" });

    // Aakhri step: highlight hue hisse par click hote hi tour band
    const onTargetClick = () => finish();
    if (step.last) el.addEventListener("click", onTargetClick, true);

    let raf;
    const tick = () => {
      const r = el.getBoundingClientRect();
      setRect((prev) =>
        prev &&
        prev.top === r.top &&
        prev.left === r.left &&
        prev.width === r.width &&
        prev.height === r.height
          ? prev
          : { top: r.top, left: r.left, width: r.width, height: r.height }
      );
      setVp((prev) =>
        prev.w === window.innerWidth && prev.h === window.innerHeight
          ? prev
          : { w: window.innerWidth, h: window.innerHeight }
      );
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("click", onTargetClick, true);
    };
  }, [step, finish]);

  // Card ki asli unchai naapo, taaki wo screen ke bahar na jaye
  useLayoutEffect(() => {
    if (cardRef.current) {
      const h = cardRef.current.offsetHeight;
      setCardH((prev) => (prev === h ? prev : h));
    }
  });

  if (!step) return null;

  const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1));

  const dots = (
    <div className="flex items-center gap-1.5">
      {steps.map((s, i) => (
        <span
          key={s.id}
          className="h-1.5 rounded-full transition-all"
          style={{
            width: i === index ? 20 : 6,
            backgroundColor: i === index ? "#b5694a" : "#dccbb9",
          }}
        />
      ))}
    </div>
  );

  const body = (
    <div className="rounded-3xl border border-line bg-card p-5 shadow-2xl">
      {dots}
      <h2 className="mt-3 text-lg font-bold text-ink">{step.title}</h2>

      {step.list && (
        <ol className="mt-3 space-y-2.5">
          {step.list.map((item, i) => (
            <li key={item} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-card">
                {i + 1}
              </span>
              <span className="text-sm leading-snug text-ink">{item}</span>
            </li>
          ))}
        </ol>
      )}

      {step.text && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
          {step.text}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={finish}
          className="px-1 py-2 text-sm font-medium text-ink-soft underline-offset-2 active:opacity-60"
        >
          {isLast ? "Baad mein" : "Skip karein"}
        </button>
        {!isLast && (
          <button
            type="button"
            onClick={next}
            className="flex items-center gap-2 rounded-2xl bg-brand px-5 py-2.5 text-sm font-semibold text-card transition active:scale-95"
          >
            Aage badhein
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  const styles = (
    <style>{`
      @keyframes tour-pulse {
        0%   { box-shadow: 0 0 0 9999px rgba(0,0,0,.62), 0 0 0 0 rgba(181,105,74,.9); }
        70%  { box-shadow: 0 0 0 9999px rgba(0,0,0,.62), 0 0 0 16px rgba(181,105,74,0); }
        100% { box-shadow: 0 0 0 9999px rgba(0,0,0,.62), 0 0 0 0 rgba(181,105,74,0); }
      }
      @keyframes tour-bounce {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-6px); }
      }
    `}</style>
  );

  // ---- Bina target wale steps: beech mein card ----
  if (!step.target) {
    return (
      <>
        {styles}
        <div className="fixed inset-0 z-[60] bg-black/60" />
        <div className="pointer-events-none fixed inset-0 z-[62] flex items-center justify-center px-5">
          <div className="pointer-events-auto w-full max-w-sm">{body}</div>
        </div>
      </>
    );
  }

  // ---- Target wale steps: highlight + paas mein card ----
  if (!rect) return null;

  const hole = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  const GAP = 14;
  const cardW = Math.min(340, vp.w - 32);
  const targetCenter = rect.left + rect.width / 2;
  const cardLeft = Math.max(16, Math.min(targetCenter - cardW / 2, vp.w - cardW - 16));
  const arrowLeft = Math.max(20, Math.min(targetCenter - cardLeft - 8, cardW - 36));

  // Card kahan: neeche, upar, ya (dono mein jagah na ho to) screen ke neeche kinare
  const spaceBelow = vp.h - (hole.top + hole.height);
  const spaceAbove = hole.top;
  let mode = "overlay";
  if (spaceBelow >= cardH + GAP + 12) mode = "below";
  else if (spaceAbove >= cardH + GAP + 12) mode = "above";

  const cardPos =
    mode === "below"
      ? { top: hole.top + hole.height + GAP }
      : mode === "above"
        ? { bottom: vp.h - hole.top + GAP }
        : { bottom: 16 };

  return (
    <>
      {styles}

      {/* Last step ke alawa baaki steps mein page par click band */}
      <div
        className="fixed inset-0 z-[60]"
        style={{ pointerEvents: isLast ? "none" : "auto" }}
      />

      {/* Highlight: bahar ka hissa dark, andar ka saaf */}
      <div
        className="pointer-events-none fixed z-[61] rounded-3xl"
        style={{
          ...hole,
          boxShadow: "0 0 0 9999px rgba(0,0,0,.62)",
          animation: isLast ? "tour-pulse 1.6s ease-out infinite" : "none",
        }}
      />

      {/* Card + teer */}
      <div
        className="fixed z-[62]"
        style={{
          left: cardLeft,
          width: cardW,
          ...cardPos,
          animation: isLast ? "tour-bounce 1.2s ease-in-out infinite" : "none",
        }}
      >
        <div className="relative" ref={cardRef}>
          {body}
          {mode !== "overlay" && (
            <span
              className="absolute h-4 w-4 rotate-45 border-line bg-card"
              style={{
                left: arrowLeft,
                ...(mode === "above"
                  ? { bottom: -8, borderRightWidth: 1, borderBottomWidth: 1 }
                  : { top: -8, borderLeftWidth: 1, borderTopWidth: 1 }),
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}