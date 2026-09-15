export default function SectionTitle({ eyebrow, title, lead }) {
  return (
    <div className="sectionhead">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {lead && <p className="lead">{lead}</p>}
    </div>
  );
}
