import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/lib/cart-context";
import HomePage from "@/pages/home";
import HikesPage from "@/pages/hikes";
import HikeDetailPage from "@/pages/hike-detail";
import RentPage from "@/pages/rent";
import MuslimHikingPage from "@/pages/muslim-hiking";
import MuslimHikingUkPage from "@/pages/muslim-hiking-uk";
import MuslimHikingBeginnersPage from "@/pages/muslim-hiking-beginners";
import MuslimHikingWomenPage from "@/pages/muslim-hiking-women";
import BlogIndexPage from "@/pages/blog-index";
import BlogPostPage from "@/pages/blog-post";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import AdminPage from "@/pages/admin";
import BookingSuccessPage from "@/pages/booking-success";
import BookingsPage from "@/pages/bookings";
import CartPage from "@/pages/cart";
import NotFoundPage from "@/pages/not-found";
import PrivacyPage from "@/pages/privacy";
import CookiesPage from "@/pages/cookies";
import TermsPage from "@/pages/terms";
import RefundPage from "@/pages/refund";
import { SiteShell } from "@/components/site-shell";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <CartProvider>
        <BrowserRouter>
          <SiteShell>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/muslim-hiking" element={<MuslimHikingPage />} />
              <Route path="/muslim-hiking/uk" element={<MuslimHikingUkPage />} />
              <Route path="/muslim-hiking/beginners" element={<MuslimHikingBeginnersPage />} />
              <Route path="/muslim-hiking/women" element={<MuslimHikingWomenPage />} />
              <Route path="/blog" element={<BlogIndexPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/hikes" element={<HikesPage />} />
              <Route path="/hikes/:id" element={<HikeDetailPage />} />
              <Route path="/rent" element={<RentPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
              <Route path="/bookings/success" element={<BookingSuccessPage />} />
              <Route path="/booking-success" element={<BookingSuccessPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/refund" element={<RefundPage />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </SiteShell>
          <Toaster position="top-right" richColors closeButton />
        </BrowserRouter>
      </CartProvider>
    </ThemeProvider>
  );
}
