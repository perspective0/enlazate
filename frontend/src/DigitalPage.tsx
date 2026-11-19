import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Star,
  Wifi,
  BookOpen,
} from "lucide-react";
import "./digitalpage.css";
import { WiFiCardPremium } from "./components/WiFiCardPremium";

function WiFiCard({
  network,
  password,
  background = "#f0f9ff",
  color = "#2a7ae2",
}: {
  network?: string;
  password?: string;
  background?: string;
  color?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (password) {
      void navigator.clipboard?.writeText(password).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  return (
    <main className="digital-action wifi-card" style={{ background }}>
      <Wifi size={38} className="wifi-icon" style={{ color }} />
      <p className="wifi-label">Red</p>
      <strong className="wifi-ssid" style={{ color }}>
        {network || "Wi‑Fi"}
      </strong>
      <p className="wifi-label">Contraseña</p>
      <div className="wifi-pass">
        {password || "Consulta al personal"}
        {password && (
          <button
            aria-label="Copiar contraseña"
            className="copy-btn"
            onClick={copy}
          >
            <Copy size={15} />
          </button>
        )}
        {copied && <span className="copy-notice">Copiada</span>}
      </div>
    </main>
  );
}

const MENU_ITEMS_PER_PAGE = 6;
type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price_dop: number | string | null;
  image_url: string | null;
};
type MenuCategory = { id: number; name: string; items: MenuItem[] };
type Page = {
  page_type: string;
  title: string;
  subtitle: string | null;
  business_name: string | null;
  logo_url: string | null;
  cover_url: string | null;
  content: Record<string, string> | null;
  categories: MenuCategory[];
};
export default function DigitalPage({
  api,
  slug,
}: {
  api: string;
  slug: string;
}) {
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState("");
  const [categoryPages, setCategoryPages] = useState<Record<number, number>>(
    {},
  );
  useEffect(() => {
    let cancelled = false;
    fetch(`${api}/api/digital-pages/${slug}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(data.message || "Página no disponible");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        if (data.page) {
          setPage(data.page);
          setCategoryPages({});
        } else setError("Página no encontrada");
      })
      .catch((reason) => {
        if (!cancelled)
          setError(
            reason instanceof Error
              ? reason.message
              : "No se pudo cargar esta página",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [api, slug]);
  if (error) return <div className="digital-error">{error}</div>;
  if (!page) return <div className="loading">Cargando…</div>;
  const content = page.content || {};
  const categories = page.categories || [];
  const externalUrl =
    content.url && /^https?:\/\//i.test(content.url) ? content.url : "";
  return (
    <div
      className={`digital-page ${page.page_type}${page.page_type === "menu" && page.cover_url ? " has-cover" : ""}`}
    >
      {page.page_type === "wifi" && page.cover_url && (
        <div
          className="wifi-cover-wrapper"
          style={{ backgroundImage: `url(${page.cover_url})` }}
        >
          {page.logo_url && (
            <img className="wifi-logo-overlay" src={page.logo_url} alt="" />
          )}
        </div>
      )}
      {page.page_type !== "wifi" && page.cover_url && (
        <img className="digital-cover" src={page.cover_url} alt="" />
      )}
      <header className="digital-head">
        {page.page_type !== "wifi" && page.logo_url && (
          <img src={page.logo_url} alt="" />
        )}
        {page.business_name && <p className="eyebrow">{page.business_name}</p>}
        {page.page_type === "wifi" ? (
          <section className="wifi-header-premium">
            <h1>{page.title}</h1>
            {page.subtitle && <p>{page.subtitle}</p>}
          </section>
        ) : (
          <>
            <h1>{page.title}</h1>
            {page.subtitle && <p>{page.subtitle}</p>}
          </>
        )}
      </header>
      {page.page_type === "menu" && (
        <main className="digital-menu">
          {categories.length === 0 ? (
            <div className="digital-menu-empty">
              <BookOpen size={24} />
              <p>El menú se está preparando.</p>
            </div>
          ) : (
            categories.map((category) => {
              const items = category.items || [];
              const totalPages = Math.ceil(items.length / MENU_ITEMS_PER_PAGE);
              const currentPage = Math.min(
                categoryPages[category.id] || 1,
                Math.max(totalPages, 1),
              );
              const startIndex = (currentPage - 1) * MENU_ITEMS_PER_PAGE;
              return (
                <section key={category.id}>
                  <h2>{category.name}</h2>
                  {items.length === 0 ? (
                    <p className="digital-menu-category-empty">Próximamente</p>
                  ) : (
                    items
                      .slice(startIndex, startIndex + MENU_ITEMS_PER_PAGE)
                      .map((item) => (
                        <article
                          className={
                            item.image_url ? "with-image" : "without-image"
                          }
                          key={item.id}
                        >
                          {item.image_url && (
                            <img
                              className="digital-menu-item-image"
                              src={item.image_url}
                              alt={item.name}
                              loading="lazy"
                            />
                          )}
                          <div className="digital-menu-item-copy">
                            <h3>{item.name}</h3>
                            {item.description && <p>{item.description}</p>}
                          </div>
                          {item.price_dop !== null && item.price_dop !== "" && (
                            <strong>
                              RD${" "}
                              {Number(item.price_dop).toLocaleString("es-DO", {
                                minimumFractionDigits: 2,
                              })}
                            </strong>
                          )}
                        </article>
                      ))
                  )}
                  {totalPages > 1 && (
                    <nav
                      className="digital-menu-pagination"
                      aria-label={`Paginación de ${category.name}`}
                    >
                      <button
                        type="button"
                        aria-label={`Página anterior de ${category.name}`}
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCategoryPages((pages) => ({
                            ...pages,
                            [category.id]: currentPage - 1,
                          }))
                        }
                      >
                        <ChevronLeft size={16} /> Anterior
                      </button>
                      <span aria-live="polite">
                        Página {currentPage} de {totalPages}
                      </span>
                      <button
                        type="button"
                        aria-label={`Página siguiente de ${category.name}`}
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          setCategoryPages((pages) => ({
                            ...pages,
                            [category.id]: currentPage + 1,
                          }))
                        }
                      >
                        Siguiente <ChevronRight size={16} />
                      </button>
                    </nav>
                  )}
                </section>
              );
            })
          )}
        </main>
      )}
      {page.page_type === "wifi" && (
        <WiFiCardPremium
          network={content.network}
          password={content.password}
          background="#e8f4ff"
          color="#0066cc"
        />
      )}
      {page.page_type === "contact" && (
        <section className="digital-action contact-section fade-in">
          <div className="contact-icons">
            {content.phone && <Phone size={32} className="contact-icon" />}
            {content.email && <Mail size={32} className="contact-icon" />}
          </div>
          <div className="contact-buttons">
            {content.phone && (
              <a className="button contact-button" href={`tel:${content.phone}`}>
                <Phone size={16} className="button-icon" /> Llamar
              </a>
            )}
            {content.email && (
              <a className="button secondary contact-button" href={`mailto:${content.email}`}>
                <Mail size={16} className="button-icon" /> Enviar correo
              </a>
            )}
            {!content.phone && !content.email && (
              <p className="contact-placeholder">Los datos de contacto estarán disponibles próximamente.</p>
            )}
          </div>
        </section>
      )}
      {["reviews", "maps", "whatsapp"].includes(page.page_type) && (
        <main className="digital-action">
          <div className="digital-icon">
            {page.page_type === "reviews" ? (
              <Star />
            ) : page.page_type === "maps" ? (
              <MapPin />
            ) : (
              <ExternalLink />
            )}
          </div>
          {externalUrl ? (
            <a
              className="button"
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {page.page_type === "reviews"
                ? "Dejar una reseña"
                : page.page_type === "maps"
                  ? "Abrir en Google Maps"
                  : "Contactar por WhatsApp"}
            </a>
          ) : (
            <p>Este enlace estará disponible próximamente.</p>
          )}
        </main>
      )}

      <footer className="digital-footer">
        <div className="powered-by">Impulsado por ENLÁZATE</div>
        <div className="footer-author">By Francisco Leocadio</div>
      </footer>
    </div>
  );
}
