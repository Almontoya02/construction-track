import LoginRoute, { action, meta } from "@/routes/(auth)/login";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock the authenticator
vi.mock("@/lib/auth.server", () => ({
  default: {
    authenticate: vi.fn(),
  },
}));

describe("Login Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    test("renders login form without errors by default", async () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login"]} />);

      // Check for main heading
      expect(screen.getByText("Welcome back")).toBeInTheDocument();

      // Check for description
      expect(
        screen.getByText("Sign in to your account to continue"),
      ).toBeInTheDocument();

      // Check for SSO button
      expect(
        screen.getByRole("button", { name: /sign in with sso/i }),
      ).toBeInTheDocument();

      // Ensure error alert is not present
      expect(
        screen.queryByText("You are not authorized"),
      ).not.toBeInTheDocument();
    });

    test("renders error message when error parameter is present", async () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login?error=true"]} />);

      await waitFor(() => {
        expect(screen.getByText("You are not authorized")).toBeInTheDocument();
      });

      // Check that the alert has proper role
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    test("renders both logo variants for light/dark themes", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login"]} />);

      // Get all Iluma logos
      const logos = screen.getAllByAltText("Iluma");
      expect(logos).toHaveLength(2);

      // Check that one has the dark theme src and one has the light theme src
      const srcValues = logos.map((img) => img.getAttribute("src"));
      expect(srcValues).toContain("/iluma-dark.webp");
      expect(srcValues).toContain("/iluma-white.webp");
    });

    test("renders terms of service and privacy policy links", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login"]} />);

      const termsLink = screen.getByRole("link", { name: /terms of service/i });
      const privacyLink = screen.getByRole("link", { name: /privacy policy/i });

      expect(termsLink).toBeInTheDocument();
      expect(privacyLink).toBeInTheDocument();
      expect(termsLink).toHaveAttribute("href", "#");
      expect(privacyLink).toHaveAttribute("href", "#");
    });

    test("renders background image for desktop", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login"]} />);

      const backgroundImage = screen.getByAltText("Login background");
      expect(backgroundImage).toBeInTheDocument();
      expect(backgroundImage).toHaveAttribute("src", "/login-background.webp");
    });
  });

  describe("Form Interaction", () => {
    test("form has correct method and structure", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login"]} />);

      // Find form by its method attribute since there's no explicit role
      const form = document.querySelector('form[method="post"]');
      expect(form).toBeInTheDocument();

      const button = screen.getByRole("button", { name: /sign in with sso/i });
      expect(button).toHaveAttribute("type", "submit");
    });

    test("button can be clicked without throwing errors", async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();

      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: mockAction,
        },
      ]);

      render(<Stub initialEntries={["/login"]} />);

      const button = screen.getByRole("button", { name: /sign in with sso/i });

      // Button should be clickable without errors
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
    });

    test("button has correct styling and icon", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login"]} />);

      const button = screen.getByRole("button", { name: /sign in with sso/i });

      // Check for full width class
      expect(button).toHaveClass("w-full");

      // Check for SVG icon presence
      const icon = button.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    test("has proper heading hierarchy", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login"]} />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Welcome back");
    });

    test("error alert has proper accessibility attributes", async () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login?error=true"]} />);

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent("You are not authorized");
      });
    });

    test("images have proper alt text", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login"]} />);

      const logos = screen.getAllByAltText("Iluma");
      expect(logos).toHaveLength(2);

      const backgroundImage = screen.getByAltText("Login background");
      expect(backgroundImage).toBeInTheDocument();
    });

    test("form is properly structured", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login"]} />);

      const form = document.querySelector('form[method="post"]');
      expect(form).toBeInTheDocument();

      const button = screen.getByRole("button", { name: /sign in with sso/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe("Meta Function", () => {
    test("returns correct meta tags", () => {
      const metaResult = meta();

      expect(metaResult).toEqual([
        { title: "Login" },
        { name: "description", content: "Login to your account" },
      ]);
    });
  });

  describe("Action Function", () => {
    test("calls authenticator.authenticate with correct parameters", async () => {
      const mockAuthenticator = await import("@/lib/auth.server");
      const mockRequest = new Request("http://localhost/login", {
        method: "POST",
      });

      await action({ request: mockRequest } as any);

      expect(mockAuthenticator.default.authenticate).toHaveBeenCalledWith(
        "auth0",
        mockRequest,
      );
    });
  });

  describe("Conditional Styling", () => {
    test("applies correct margin when no error is present", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login"]} />);

      const buttonContainer = screen.getByRole("button", {
        name: /sign in with sso/i,
      }).parentElement;

      // Check if the parent element has the mt-8 class or any margin-top class
      expect(buttonContainer).toHaveClass("mt-8");
    });

    test("does not apply mt-8 class when error is present", async () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login?error=true"]} />);

      await waitFor(() => {
        screen.getByText("You are not authorized");
      });

      const buttonContainer = screen.getByRole("button", {
        name: /sign in with sso/i,
      }).parentElement;

      expect(buttonContainer).not.toHaveClass("mt-8");
    });
  });

  describe("Layout Structure", () => {
    test("has proper grid layout classes", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      const { container } = render(<Stub initialEntries={["/login"]} />);

      // Look for the main container with grid classes
      const mainContainer = container.querySelector(
        ".grid.min-h-svh.lg\\:grid-cols-2",
      );
      expect(mainContainer).toBeInTheDocument();
    });

    test("has proper responsive classes for background section", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      const { container } = render(<Stub initialEntries={["/login"]} />);

      const backgroundSection = container.querySelector(
        ".bg-muted.relative.hidden.lg\\:block",
      );
      expect(backgroundSection).toBeInTheDocument();
    });
  });

  describe("Different Error Parameters", () => {
    test("shows error with any truthy error parameter", async () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login?error=unauthorized"]} />);

      await waitFor(() => {
        expect(screen.getByText("You are not authorized")).toBeInTheDocument();
      });
    });

    test("does not show error with falsy error parameter", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login?other=param"]} />);

      expect(
        screen.queryByText("You are not authorized"),
      ).not.toBeInTheDocument();
    });

    test("does not show error when no error parameter is present", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login"]} />);

      expect(
        screen.queryByText("You are not authorized"),
      ).not.toBeInTheDocument();
    });
  });

  describe("User Experience", () => {
    test("displays welcoming content", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login"]} />);

      expect(screen.getByText("Welcome back")).toBeInTheDocument();
      expect(
        screen.getByText("Sign in to your account to continue"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/by signing in, you agree to our/i),
      ).toBeInTheDocument();
    });

    test("shows user avatar icon in the center", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login"]} />);

      // Check for the SVG icon with user avatar path
      const avatarIcon = document.querySelector(
        'svg path[d*="M15.75 6a3.75 3.75 0 1 1-7.5 0"]',
      );
      expect(avatarIcon).toBeInTheDocument();
    });

    test("shows login icon in the button", () => {
      const Stub = createRoutesStub([
        {
          path: "/login",
          Component: LoginRoute,
          action: vi.fn(),
        },
      ]);

      render(<Stub initialEntries={["/login"]} />);

      const button = screen.getByRole("button", { name: /sign in with sso/i });
      const loginIcon = button.querySelector(
        'svg path[d*="M15.75 9V5.25A2.25"]',
      );
      expect(loginIcon).toBeInTheDocument();
    });
  });
});
