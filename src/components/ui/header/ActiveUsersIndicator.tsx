"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { Dropdown } from "react-bootstrap";
import { Users } from "react-feather";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAppSelector } from "@/lib/store/hook";
import { GET_ACTIVE_USERS_BY_OUTLET_QUERY } from "@/lib/graphql/query/outlet";

dayjs.extend(relativeTime);

type ActiveUser = {
  userid: number;
  userfullname: string;
  initials: string;
  lastactivity: string | null;
};

type OutletActiveUsers = {
  outletid: number;
  outletname: string;
  users: ActiveUser[];
};

// Stable per-user color from userid, so the same person's avatar always looks the same
// (matches the general "presence chip" convention in tools like this) — hashed rather
// than random so it doesn't jitter on every refetch.
const AVATAR_COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#22c55e",
];
function colorForUser(userid: number): string {
  return AVATAR_COLORS[Math.abs(userid) % AVATAR_COLORS.length];
}

const MAX_VISIBLE_PER_OUTLET = 5;

/**
 * Top-bar presence indicator — "who's logged in right now," grouped by outlet, MS
 * Teams-style avatar initials. Backed by getActiveUsersByOutlet, which reuses the
 * existing usersession table (same one the concurrent-session-limit feature already
 * uses) rather than a new real-time heartbeat — so this reflects "logged in and active
 * within the last few hours," not second-by-second presence. Polled every 60s, which is
 * already far more frequent than the underlying data actually changes (lastactivity
 * only updates on a token refresh, ~every 55 min at most), just enough that a fresh
 * login/logout shows up reasonably promptly.
 */
const ActiveUsersIndicator = () => {
  const store = useAppSelector((state) => state.store.data);
  const storeid = store?.storeid;

  const { data, error } = useQuery(GET_ACTIVE_USERS_BY_OUTLET_QUERY, {
    variables: { storeid: Number(storeid) },
    skip: !storeid,
    pollInterval: 60000,
    fetchPolicy: "cache-and-network",
  });

  if (error && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error("[ActiveUsersIndicator] getActiveUsersByOutlet failed:", error);
  }

  const outlets: OutletActiveUsers[] = useMemo(
    () => (data?.getActiveUsersByOutlet ?? []).filter((o: OutletActiveUsers) => o.users.length > 0),
    [data]
  );

  const totalActive = useMemo(
    () => new Set(outlets.flatMap((o) => o.users.map((u) => u.userid))).size,
    [outlets]
  );

  // Always show the icon once we have a store to query for — even at 0, so the
  // indicator is a permanent, findable fixture rather than something that only
  // sometimes exists (and so it's actually visible to debug against, rather than
  // silently disappearing if the count happens to come back 0).
  if (!storeid) return null;

  return (
    <Dropdown as="li" className="nav-item dropdown nav-item-box" align="end">
      <Dropdown.Toggle
        as="a"
        href="#"
        role="button"
        className="dropdown-toggle nav-link"
        title="Who's logged in"
      >
        <Users size={18} />
        {totalActive > 0 && (
          <span className="badge rounded-pill bg-success">{totalActive}</span>
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu className="notifications" style={{ minWidth: 280 }}>
        <div className="topnav-dropdown-header">
          <span className="notification-title">
            {totalActive > 0 ? `${totalActive} logged in now` : "Who's logged in"}
          </span>
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {outlets.length === 0 && (
            <div className="px-3 py-3 text-muted text-center" style={{ fontSize: 13 }}>
              No one else is logged in right now
            </div>
          )}
          {outlets.map((outlet) => (
            <div key={outlet.outletid} className="px-3 py-2 border-bottom">
              <div className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: "0.68rem", letterSpacing: "0.07em" }}>
                {outlet.outletname}
              </div>
              <div className="d-flex flex-wrap gap-2">
                {outlet.users.slice(0, MAX_VISIBLE_PER_OUTLET).map((u) => (
                  <div
                    key={u.userid}
                    title={`${u.userfullname}${u.lastactivity ? ` — active ${dayjs(u.lastactivity).fromNow()}` : ""}`}
                    className="d-flex align-items-center justify-content-center rounded-circle text-white fw-semibold"
                    style={{
                      width: 32,
                      height: 32,
                      fontSize: 12,
                      backgroundColor: colorForUser(u.userid),
                      flex: "none",
                    }}
                  >
                    {u.initials}
                  </div>
                ))}
                {outlet.users.length > MAX_VISIBLE_PER_OUTLET && (
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle bg-light text-muted fw-semibold"
                    style={{ width: 32, height: 32, fontSize: 11, flex: "none" }}
                    title={outlet.users.slice(MAX_VISIBLE_PER_OUTLET).map((u) => u.userfullname).join(", ")}
                  >
                    +{outlet.users.length - MAX_VISIBLE_PER_OUTLET}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ActiveUsersIndicator;
