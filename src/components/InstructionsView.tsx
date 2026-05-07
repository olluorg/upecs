import { IconStar, IconHand, IconUsers, IconHeart, IconSparkles } from "./Icons";
import { useT } from "../utils/I18nContext";

const TOOL_ICONS = [
  <IconStar size={20} />,
  <IconHand size={20} />,
  <IconUsers size={20} />,
  <IconHeart size={20} />,
];

export default function InstructionsView() {
  const t = useT();
  const d = t.instructions;

  return (
    <div className="docs">
      <div className="library-head">
        <div>
          <h1>{d.title}</h1>
          <p className="muted">{d.subtitle}</p>
        </div>
      </div>

      <nav className="docs-toc" aria-label={d.toc}>
        <div className="docs-toc-title">{d.toc}</div>
        <ol>
          {d.sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{i + 1}. {s.tocLabel}</a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="docs-callout">{d.disclaimer}</div>

      {d.sections.map((sec) => {
        if (sec.id === "what") {
          return (
            <section key={sec.id} id={sec.id}>
              <h2>{sec.heading}</h2>
              {sec.body.map((p, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
              ))}
            </section>
          );
        }
        if (sec.id === "whom") {
          return (
            <section key={sec.id} id={sec.id}>
              <h2>{sec.heading}</h2>
              <p>{sec.intro}</p>
              <ul>{sec.list.map((item, i) => <li key={i}>{item}</li>)}</ul>
              <p>{sec.outro}</p>
            </section>
          );
        }
        if (sec.id === "phases") {
          return (
            <section key={sec.id} id={sec.id}>
              <h2>{sec.heading}</h2>
              <p>{sec.intro}</p>
              {sec.phases.map((ph, i) => (
                <div key={i}>
                  <h3>{ph.title}</h3>
                  <p>{ph.text}</p>
                </div>
              ))}
            </section>
          );
        }
        if (sec.id === "start") {
          return (
            <section key={sec.id} id={sec.id}>
              <h2>{sec.heading}</h2>
              <ol>
                {sec.steps.map((step, i) => (
                  <li key={i}>
                    <strong>{step.strong}</strong>{" "}{step.text}
                  </li>
                ))}
              </ol>
            </section>
          );
        }
        if (sec.id === "tips") {
          return (
            <section key={sec.id} id={sec.id}>
              <h2>{sec.heading}</h2>
              <ul>
                {sec.list.map((item, i) => (
                  <li key={i}>
                    <strong>{item.strong}</strong>{" "}{item.text}
                  </li>
                ))}
              </ul>
            </section>
          );
        }
        if (sec.id === "tool") {
          return (
            <section key={sec.id} id={sec.id}>
              <h2>{sec.heading}</h2>
              <div className="instr-list">
                {sec.steps.map((step, i) => (
                  <div key={i} className="instr-row">
                    <span className="instr-icon">{TOOL_ICONS[i]}</span>
                    <div>
                      <div className="instr-title">{step.title}</div>
                      <div className="instr-text">{step.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="docs-note">{sec.note}</p>
            </section>
          );
        }
        if (sec.id === "faq") {
          return (
            <section key={sec.id} id={sec.id}>
              <h2>{sec.heading}</h2>
              {sec.items.map((item, i) => (
                <div key={i}>
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </div>
              ))}
            </section>
          );
        }
        return null;
      })}

      <div className="instr-tip">
        <IconSparkles size={18} />
        <span>{d.footer}</span>
      </div>
    </div>
  );
}
