import React, { useState, useCallback } from "react";
import {
  Heart,
  MapPin,
  ArrowUpRight,
  GraduationCap,
  BookOpen,
  Globe,
  Search,
} from "lucide-react";
import { api, useResource } from "../api";
import { useAction, useApp } from "../context";
import {
  Resource,
  PageHead,
  SearchField,
  Badge,
  IconButton,
  Empty,
  Modal,
} from "../components/UI";
export default function Universities() {
  const state = useResource("/universities"),
    [query, setQuery] = useState(""),
    [country, setCountry] = useState("All countries"),
    [saved, setSaved] = useState(false),
    [selected, setSelected] = useState(null),
    { notify } = useApp();
  const [run, busy] = useAction();
  const close = useCallback(() => setSelected(null), []);
  const bookmark = (u) =>
    run(async () => {
      await api(`/universities/${u.id}/bookmark`, {
        method: "PUT",
        body: { saved: !u.bookmarked },
      });
      if (selected?.id === u.id)
        setSelected({ ...u, bookmarked: !u.bookmarked });
      state.reload();
      notify(
        u.bookmarked
          ? "Removed from your shortlist."
          : "Added to your shortlist.",
      );
    });
  return (
    <>
      <PageHead
        eyebrow="A BIGGER WORLD IS WAITING"
        title="Find a place to grow."
        description="Explore campuses, compare subjects, and save the places that spark your imagination."
      />
      <div className="university-hero">
        <div>
          <Badge>YOUR FUTURE, YOUR POSSIBILITIES</Badge>
          <h2>
            A new place.
            <br />A new perspective.
          </h2>
          <p>Great journeys begin with a little exploration.</p>
        </div>
        <img src="/art/campus.svg" alt="Illustrated university campus" />
      </div>
      <div className="notice">
        Sample directory: these fictional institutions and fees demonstrate
        university search. They are not admissions information.
      </div>
      <Resource state={state}>
        {(d) => {
          const us = d.universities.filter(
            (u) =>
              (!saved || u.bookmarked) &&
              (country === "All countries" || u.country === country) &&
              `${u.name} ${u.city} ${u.field} ${u.programs.join(" ")}`
                .toLowerCase()
                .includes(query.toLowerCase()),
          );
          return (
            <>
              <div className="filter-bar">
                <SearchField
                  value={query}
                  onChange={setQuery}
                  placeholder="Search a university, city, or subject…"
                />
                <label className="sr-only" htmlFor="country-filter">
                  Country
                </label>
                <select
                  id="country-filter"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {[
                    "All countries",
                    ...new Set(d.universities.map((u) => u.country)),
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <button
                  className={`button ${saved ? "primary" : "secondary"}`}
                  onClick={() => setSaved(!saved)}
                >
                  <Heart size={16} fill={saved ? "currentColor" : "none"} />
                  My shortlist
                </button>
              </div>
              <div className="results-label">{us.length} places to explore</div>
              {us.length ? (
                <div className="university-grid">
                  {us.map((u, i) => (
                    <article className="panel university-card" key={u.id}>
                      <div
                        className={`university-art ${["mint", "sky", "peach", "lavender"][i % 4]}`}
                      >
                        <img src={`/art/${u.art}.svg`} alt="" />
                        <IconButton
                          label={
                            u.bookmarked ? "Remove bookmark" : "Save university"
                          }
                          onClick={() => bookmark(u)}
                          disabled={busy}
                        >
                          <Heart
                            size={19}
                            fill={u.bookmarked ? "#ed7185" : "none"}
                            color={u.bookmarked ? "#ed7185" : "currentColor"}
                          />
                        </IconButton>
                      </div>
                      <div className="university-info">
                        <Badge>{u.field}</Badge>
                        <h3>{u.name}</h3>
                        <p>
                          <MapPin size={15} />
                          {u.city}, {u.country}
                        </p>
                        <div className="program-tags">
                          {u.programs.map((p) => (
                            <span key={p}>{p}</span>
                          ))}
                        </div>
                        <div className="card-bottom">
                          <span>Sample campus</span>
                          <button
                            className="text-button"
                            onClick={() => setSelected(u)}
                          >
                            Explore
                            <ArrowUpRight size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty
                  icon={GraduationCap}
                  title="A new possibility is out there"
                  text="Try another search, or save a university to your shortlist."
                />
              )}
            </>
          );
        }}
      </Resource>
      {selected && (
        <Modal title={selected.name} onClose={close} wide>
          <div className="campus-detail">
            <img
              className="campus-detail-art"
              src="/art/campus.svg"
              alt="Illustrated campus"
            />
            <Badge>Fictional sample institution</Badge>
            <h2>A place for your next chapter.</h2>
            <p>{selected.description}</p>
            <div className="detail-facts">
              <div>
                <MapPin size={19} />
                <span>
                  <small>LOCATION</small>
                  <strong>
                    {selected.city}, {selected.country}
                  </strong>
                </span>
              </div>
              <div>
                <BookOpen size={19} />
                <span>
                  <small>SPECIALISM</small>
                  <strong>{selected.field}</strong>
                </span>
              </div>
              <div>
                <GraduationCap size={19} />
                <span>
                  <small>ILLUSTRATIVE TUITION</small>
                  <strong>{selected.tuition}</strong>
                </span>
              </div>
            </div>
            <h3>Programs to explore</h3>
            <div className="program-tags">
              {selected.programs.map((p) => (
                <span key={p}>{p}</span>
              ))}
            </div>
            <div className="button-row">
              <button
                className="button primary"
                disabled={busy}
                onClick={() => bookmark(selected)}
              >
                <Heart size={17} />
                {selected.bookmarked
                  ? "Remove from shortlist"
                  : "Save to my shortlist"}
              </button>
              <a
                className="button secondary"
                href={`https://www.openstreetmap.org/?mlat=${selected.lat}&mlon=${selected.lng}#map=12/${selected.lat}/${selected.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                <Globe size={17} />
                View city on map
                <ArrowUpRight size={15} />
              </a>
            </div>
            <p className="footnote">
              Map opens the real city in OpenStreetMap. The sample university
              has no real campus or admissions office.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
