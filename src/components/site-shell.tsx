import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Compass,
  LogIn,
  LogOut,
  Mountain,
  MountainSnow,
  Sparkles,
  TreePine,
  UserPlus,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type Me = {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
};

export type AuthContextValue = {
  user: Me | null;
  loading: boolean;
  refresh: () => Promise<Me | null>;
  signOut: () => Promise<void>;
  setUser: (u: Me | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within SiteShell");
  return ctx;
}

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/hikes", label: "Hikes" },
  { to: "/rent", label: "Rent" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const refresh = async () => {
    try {
      const data = await api<{ user: Me | null }>("/api/auth/me");
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const signOut = async () => {
    try {
      await api<{ ok: true }>("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    toast.success("Signed out");
    navigate("/");
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, refresh, signOut, setUser }),
    [user, loading],
  );

  const initials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <AuthContext.Provider value={value}>
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-2" aria-label="Badr Adventures home">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900 text-amber-300 shadow-sm">
                <Mountain className="h-5 w-5" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-serif text-lg font-semibold text-emerald-950">
                  Badr Adventures
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                  Guided hiking · UK
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-emerald-900 text-amber-200"
                        : "text-stone-600 hover:text-emerald-900"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              {loading ? (
                <div className="h-9 w-32 rounded-full bg-stone-200/80" />
              ) : user ? (
                <UserMenu user={user} signOut={signOut} initials={initials(user.name)} />
              ) : (
                <>
                  <Link
                    to="/sign-in"
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium text-stone-700 transition hover:border-emerald-700 hover:text-emerald-800"
                  >
                    <LogIn className="h-4 w-4" /> Sign in
                  </Link>
                  <Link
                    to="/sign-up"
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900 px-4 py-1.5 text-sm font-medium text-amber-100 shadow-sm transition hover:bg-emerald-950"
                  >
                    <UserPlus className="h-4 w-4" /> Sign up
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              aria-label="Toggle navigation"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span className="sr-only">Toggle navigation</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          {mobileOpen && (
            <div className="border-t border-stone-200 bg-white md:hidden">
              <div className="mx-auto max-w-7xl space-y-1 px-4 py-3 sm:px-6">
                {NAV_LINKS.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === "/"}
                    className={({ isActive }) =>
                      `block rounded-xl px-3 py-2 text-sm font-medium ${
                        isActive
                          ? "bg-emerald-900 text-amber-100"
                          : "text-stone-700 hover:bg-stone-100"
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
                <div className="mt-3 flex gap-2">
                  {user ? (
                    <button
                      type="button"
                      onClick={signOut}
                      className="flex-1 rounded-xl bg-emerald-900 px-4 py-2 text-sm font-medium text-amber-100"
                    >
                      <LogOut className="mr-1 inline h-4 w-4" /> Sign out
                    </button>
                  ) : (
                    <>
                      <Link to="/sign-in" className="flex-1 rounded-xl border border-stone-300 px-4 py-2 text-center text-sm font-medium text-stone-700">
                        Sign in
                      </Link>
                      <Link to="/sign-up" className="flex-1 rounded-xl bg-emerald-900 px-4 py-2 text-center text-sm font-medium text-amber-100">
                        Sign up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </header>

        <main>{children}</main>

        <footer className="mt-24 border-t border-stone-200 bg-emerald-950 text-stone-200">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
            <div>
              <div className="flex items-center gap-2 text-amber-300">
                <MountainSnow className="h-5 w-5" />
                <span className="font-serif text-xl font-semibold">Badr Adventures</span>
              </div>
              <p className="mt-3 text-sm text-stone-400">
                Guided hiking, camping, and kayaking across the UK's most beautiful landscapes.
                Leave the creature comforts at home and embrace the challenge.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-300">Explore</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link to="/hikes" className="hover:text-amber-200">All hikes</Link></li>
                <li><Link to="/about" className="hover:text-amber-200">About us</Link></li>
                <li><Link to="/contact" className="hover:text-amber-200">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-300">Account</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link to="/sign-in" className="hover:text-amber-200">Sign in</Link></li>
                <li><Link to="/sign-up" className="hover:text-amber-200">Create an account</Link></li>
                <li><Link to="/account/bookings" className="hover:text-amber-200">My bookings</Link></li>
                <li><Link to="/admin" className="hover:text-amber-200">Admin</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-300">Get in touch</h4>
              <ul className="mt-3 space-y-2 text-sm text-stone-300">
                <li>info@badradventuresuk.com</li>
                <li>+44 (0) 7700 900123</li>
                <li>Lake District · Peak District · Snowdonia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-emerald-900/60">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-stone-400 sm:flex-row sm:px-6 lg:px-8">
              <p>© {new Date().getFullYear()} Badr Adventures UK. All rights reserved.</p>
              <p className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Bringing green to your deen.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </AuthContext.Provider>
  );
}

function UserMenu({
  user,
  signOut,
  initials,
}: {
  user: Me;
  signOut: () => void;
  initials: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => navigate("/account/bookings")}
        className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 shadow-sm hover:border-stone-300 hover:bg-stone-50 sm:flex"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-900 text-[10px] font-bold text-amber-200">
          {initials}
        </span>
        <span className="max-w-[120px] truncate">{user.name.split(" ")[0]}</span>
      </button>
      <button
        type="button"
        onClick={signOut}
        className="rounded-full border border-stone-200 bg-white p-2 text-stone-600 hover:border-stone-300 hover:text-stone-900"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
