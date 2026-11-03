# AGENTS.md - AI Development Assistant Guide

> **Project:** iluma.base-front-router  
> **Purpose:** Guide AI agents and developers working on this React Router 7 application

---

## Project Overview

**iluma.base-front** is a modern frontend application built using **React Router 7** (formerly Remix patterns) and **React 19**. It implements server-side rendering (SSR), comprehensive Auth0 authentication, and a sophisticated UI component system based on the **Shadcn/ui** pattern with **Radix UI** primitives.

The application serves as a foundation for administrative interfaces with features including:

- Protected routes with role-based access control (RBAC)
- Interactive dashboards with data visualization
- Advanced data tables with drag-and-drop functionality
- Server-side pagination and fuzzy search
- Light/dark theme support
- Comprehensive testing infrastructure

---

## Core Technology Stack

### Framework & Runtime

| Technology       | Version | Purpose                                                       |
| ---------------- | ------- | ------------------------------------------------------------- |
| **React Router** | v7      | Application framework with SSR, routing, loaders, and actions |
| **React**        | v19     | UI library with concurrent features                           |
| **Vite**         | v7      | Build tool and development server with HMR                    |
| **TypeScript**   | Latest  | Static type checking and IDE support                          |
| **Node.js**      | -       | Server-side runtime                                           |

### UI Architecture (Critical Understanding)

**Component Philosophy: Shadcn/ui + Radix UI**

This is **NOT** a traditional component library like Material-UI or Ant Design. Understanding this distinction is crucial:

#### Shadcn/ui Pattern

- **NOT an npm package** - Components are **copied into your codebase** (`app/components/ui/`)
- **Full ownership** - You have complete control to modify any component
- **Copy-paste approach** - Components are added via CLI or manually copied
- **No vendor lock-in** - Components live in your repository, not node_modules
- **Customization-first** - Designed to be modified for your specific needs

#### Radix UI Primitives

- **Headless components** - Provides functionality WITHOUT styling
- **Accessibility built-in** - WAI-ARIA compliant out of the box
- **Examples:** Dialog, DropdownMenu, Select, Tabs, Tooltip, Accordion
- **Handles complexity:** Focus management, keyboard navigation, ARIA attributes
- **Styling layer:** Completely separate from functionality

#### The Stack:

```
┌─────────────────────────────────────┐
│   Your Component Code               │  ← You write/modify this
│   (app/components/ui/*)             │
├─────────────────────────────────────┤
│   Tailwind CSS Classes              │  ← Styling layer
├─────────────────────────────────────┤
│   Radix UI Primitives               │  ← Functionality layer
│   (@radix-ui/react-*)               │
├─────────────────────────────────────┤
│   React 19                          │  ← Base framework
└─────────────────────────────────────┘
```

**Example Component Structure:**

```typescript
// app/components/ui/sheet.tsx
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
    side?: "top" | "right" | "bottom" | "left"
  }
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 gap-4 bg-background p-6 shadow-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        className
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4">
        <X className="h-4 w-4" />
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
```

### Styling System

| Technology                         | Purpose                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| **Tailwind CSS**                   | v4 - Utility-first CSS framework                        |
| **CSS Variables**                  | Theme system (light/dark mode) defined in `app/app.css` |
| **next-themes**                    | Theme provider for light/dark mode switching            |
| **class-variance-authority (CVA)** | Component variant management                            |
| **tailwind-merge**                 | Intelligent class merging                               |
| **Lucide React**                   | Icon library                                            |

### Data Management

| Technology         | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| **TanStack Table** | v8 - Headless table with sorting, filtering, pagination |
| **DnD Kit**        | Drag and drop functionality (sortable, core, utilities) |
| **Zod**            | Runtime type validation and schema definition           |
| **Fuse.js**        | Fuzzy search for server-side pagination                 |

### Authentication & Security

| Technology           | Purpose                                   |
| -------------------- | ----------------------------------------- |
| **remix-auth**       | Authentication framework for React Router |
| **remix-auth-auth0** | Auth0 OAuth 2.0 integration strategy      |
| **Auth0**            | Identity provider with OIDC               |

### Data Visualization

| Technology               | Purpose                                                       |
| ------------------------ | ------------------------------------------------------------- |
| **Recharts**             | Composable charting library                                   |
| **Custom Chart Wrapper** | Theme-aware chart components in `app/components/ui/chart.tsx` |

### Testing

| Technology                | Purpose                                |
| ------------------------- | -------------------------------------- |
| **Vitest**                | Unit and integration testing framework |
| **React Testing Library** | Component testing utilities            |
| **Happy DOM**             | Fast DOM implementation for testing    |
| **createRoutesStub**      | Route context mocking for tests        |

### Code Quality

| Technology     | Purpose                              |
| -------------- | ------------------------------------ |
| **ESLint**     | Code linting                         |
| **Prettier**   | Code formatting                      |
| **Husky**      | Git hooks (pre-commit checks)        |
| **Commitlint** | Enforce conventional commit messages |

### Package Management

- **pnpm** version `10.11.0` - Fast, disk-efficient package manager

---

## Project Structure

```
iluma.base-front-router/
├── app/
│   ├── routes/
│   │   ├── (app)/              # Protected application routes
│   │   │   ├── layout.tsx      # App layout with sidebar
│   │   │   ├── route.tsx       # Dashboard (index)
│   │   │   └── clients/        # Client management module
│   │   └── (auth)/             # Authentication routes
│   │       ├── login.tsx       # Login page
│   │       └── callback.ts     # Auth0 callback handler
│   ├── components/
│   │   ├── ui/                 # Shadcn/ui components (LOCAL)
│   │   │   ├── button.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── chart.tsx
│   │   │   └── ...
│   │   ├── layouts/            # Layout-level components
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── paginated-table.tsx
│   │   │   └── data-table.tsx
│   │   ├── dashboard/          # Dashboard-specific components
│   │   └── elements/           # Reusable UI elements
│   ├── lib/
│   │   ├── auth.server.ts      # Authentication utilities
│   │   ├── pagination.server.ts # Pagination helpers
│   │   └── utils.ts            # Utility functions (cn, etc.)
│   ├── services/               # API and external services
│   ├── types/
│   │   └── auth/               # Authentication type definitions
│   ├── root.tsx                # Root layout with theme provider
│   ├── entry.server.tsx        # SSR entry point
│   ├── entry.client.tsx        # Client hydration entry
│   └── app.css                 # Global styles and CSS variables
├── test/                       # Test files
│   └── login.test.tsx
├── public/                     # Static assets
├── package.json
├── vite.config.ts             # Vite configuration
├── vitest.config.ts           # Test configuration
└── tsconfig.json              # TypeScript configuration
```

---

## Key Architecture Patterns

### 1. Server-Side Rendering (SSR)

**Entry Point:** `app/entry.server.tsx`

React Router handles request/response on the server using Node.js streams for optimal TTFB (Time to First Byte).

**Key Features:**

- Bot detection via `isbot` library
- Streaming HTML via `renderToPipeableStream`
- Different strategies for bots (`onAllReady`) vs users (`onShellReady`)
- 5-second timeout for stream completion

**Flow:**

```
Browser Request → entry.server.tsx → Bot Check → Stream Strategy Selection
→ React Component Tree Rendering → HTML Streaming → Client Hydration
```

### 2. Authentication Flow (Auth0 OAuth 2.0)

**Core File:** `app/lib/auth.server.ts`

**Components:**

- `Authenticator` instance from `remix-auth`
- `Auth0Strategy` with OAuth configuration
- Session storage via secure cookies
- User info and permission fetching via Auth0 Management API

**Login Process:**

1. User navigates to `/login`
2. Clicks "Sign in" → POST to `/login` action
3. `authenticator.authenticate("auth0")` redirects to Auth0
4. User enters credentials at Auth0
5. Auth0 redirects to `/auth/callback?code=...`
6. Callback route exchanges code for tokens
7. Fetches user profile via `getUserInfo()` and permissions via `getUserPermissions()`
8. Creates `LoginType` object with user + tokenId
9. Validates and creates session
10. Redirects to dashboard or login with error

**Authentication Wrappers (Higher-Order Functions):**

The `auth.server.ts` file provides three main wrappers for protecting routes:

#### `AuthorizedLoader(loaderFnc)`

Use when you need **user info and permissions** but don't need to make API calls.

```typescript
export const loader = AuthorizedLoader(async (args, user, permissions) => {
  // Access user and permissions directly
  return {
    user,
    canEdit: permissions.includes("app:edit:content"),
    welcomeMessage: `Hello ${user.name}!`,
  };
});
```

#### `AuthorizedLoaderWithFetcher(permission, loaderFnc)`

Use when you need **permission check + authenticated API calls**.

- First parameter: Required permission string (use `""` to skip permission check)
- Provides `fetcher` with automatic Bearer token injection
- Redirects to `/` with 302 if permission check fails

```typescript
export const loader = AuthorizedLoaderWithFetcher(
  "app:read:users", // Required permission
  async (args, fetcher, user, permissions) => {
    // Fetcher already includes Bearer token
    const response = await fetcher<User[]>("/api/users");

    if (response.error) {
      throw new Error(response.error);
    }

    return { user, users: response.data };
  },
);
```

#### `AuthorizedActionWithFetcher(permission, actionFnc)`

Use for **form actions** that need permission check + authenticated API calls.

```typescript
export const action = AuthorizedActionWithFetcher(
  "app:write:posts",
  async (args, fetcher, user, permissions) => {
    const formData = await args.request.formData();

    const response = await fetcher("/api/posts", {
      method: "POST",
      body: JSON.stringify({
        title: formData.get("title"),
        content: formData.get("content"),
      }),
      headers: { "Content-Type": "application/json" },
    });

    if (response.error) {
      return json({ error: response.error }, { status: 400 });
    }

    return redirect("/posts");
  },
);
```

**Key Internal Functions:**

- `getAuthContext(request)` - Optimized parallel fetch of user, permissions, and token
- `createAuthenticatedFetcher(token)` - Factory function that returns configured fetcher
- `getUserPermissions(userId)` - Fetches permissions from Auth0 Management API with pagination
- `getUserInfo(accessToken)` - Fetches user profile from Auth0 UserInfo endpoint
- `authenticator` - Main Remix Auth instance with Auth0 strategy

### 3. Routing & Navigation

**Configuration:** `app/routes.ts` (programmatic route config)

**Route Groups:**

- `(app)` - Protected routes with app layout and sidebar
- `(auth)` - Public authentication routes
- API routes - Resource routes (no UI)

**Permission-Based Navigation:**
Navigation items in sidebar are filtered based on `user.permissions` array:

```typescript
// app/components/elements/nav-main.tsx
items
  .filter(i => user.permissions.includes(i.permission ?? ""))
  .map(item => <NavItem {...item} />)
```

**URL State Management:**
Pagination and filters stored in URL query params (`?page=1&pageSize=10&search=term`) for:

- Shareable URLs
- Browser history integration
- Server-side data fetching

### 4. Theming System

**Global Theme:** `app/app.css`

Uses CSS variables mapped to Tailwind utilities:

```css
:root {
  --background: #ffffff;
  --foreground: #33404d;
  --primary: #1e3832;
  --border: #d5d7dd;
  --radius: 0.5rem;
}

.dark {
  --background: #1f262e;
  --foreground: #ffffff;
  --border: #454d54;
}
```

**Usage in Components:**

```typescript
<div className="bg-background text-foreground border-border">
  <h1 className="text-primary">Title</h1>
</div>
```

**Theme Provider:** Wraps app in `<ThemeProvider>` (next-themes) in `app/root.tsx`

### 5. Data Tables (Two Implementations)

#### PaginatedTable (Server-Side)

**File:** `app/components/layouts/paginated-table.tsx`

**Features:**

- URL-driven state (`page`, `pageSize`, `search`)
- Server-side pagination via `paginateArrayFromLoader()`
- Debounced search input (300ms)
- TanStack Table for sorting/filtering
- Column visibility toggle

**Server Helper:** `app/lib/pagination.server.ts`

- `parsePaginationParams()` - Extract URL params
- `paginateArray()` - Fuzzy search (Fuse.js) + slice array
- Returns `{ data: T[], pagination: { page, pageSize, totalPages, totalItems } }`

#### DataTable (Client-Side Interactive)

**File:** `app/components/layouts/data-table.tsx`

**Features:**

- Drag-and-drop row reordering (DnD Kit)
- Tabbed views (Outline, Past Performance, etc.)
- Client-side sorting and filtering
- Zod schema validation
- Local state management with `arrayMove()`

**DnD Implementation:**

```typescript
<DndContext onDragEnd={handleDragEnd}>
  <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
    {rows.map(row => (
      <DraggableRow key={row.id} row={row} />
    ))}
  </SortableContext>
</DndContext>
```

### 6. Data Visualization (Charts)

**Wrapper:** `app/components/ui/chart.tsx`

**Features:**

- Theme-aware via CSS variables (`--chart-1` through `--chart-5`)
- Recharts integration (Area, Bar, Line charts)
- Custom tooltips and legends
- Responsive design via `useIsMobile` hook

**Chart Config Pattern:**

```typescript
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;
```

### 7. Error Handling

**Root Error Boundary:** `app/root.tsx`

**Features:**

- Route errors (404s) vs unexpected exceptions
- Development mode: Stack traces visible
- Production mode: User-friendly messages
- Navigation helpers ("Go Home", "Go Back")

---

## Available Scripts

| Command          | Description                                  |
| ---------------- | -------------------------------------------- |
| `pnpm dev`       | Start development server with HMR            |
| `pnpm build`     | Build for production                         |
| `pnpm start`     | Serve production build                       |
| `pnpm typecheck` | Generate types and run TypeScript validation |
| `pnpm format`    | Format code with Prettier                    |
| `pnpm test`      | Run tests in watch mode                      |
| `pnpm test:ui`   | Open Vitest UI for interactive testing       |
| `pnpm prepare`   | Setup git hooks with Husky                   |

---

## Development Guidelines for AI Agents

### Adding New Features Checklist

#### 1. New UI Component Needed?

**DO:**

- ✅ Check if a Shadcn/ui component exists for the functionality
- ✅ Look for appropriate Radix UI primitive (Dialog, Select, Dropdown, etc.)
- ✅ Create component in `app/components/ui/` directory
- ✅ Use Tailwind classes for styling
- ✅ Leverage theme CSS variables (`bg-background`, `text-primary`, etc.)
- ✅ Ensure accessibility via Radix primitives (ARIA attributes)
- ✅ Use `cn()` utility from `@/lib/utils` for class merging

**DON'T:**

- ❌ Try to install Shadcn/ui as an npm package (it doesn't exist)
- ❌ Modify Radix primitives directly
- ❌ Use inline styles instead of Tailwind
- ❌ Forget about dark mode support

**Example:**

```typescript
// app/components/ui/my-component.tsx
import * as Primitive from "@radix-ui/react-primitive"
import { cn } from "@/lib/utils"

export function MyComponent({ className, ...props }: Props) {
  return (
    <Primitive.Root
      className={cn(
        "bg-background text-foreground",
        "border border-border rounded-md",
        className
      )}
      {...props}
    />
  )
}
```

#### 2. New Route Needed?

**DO:**

- ✅ Create route file in appropriate directory (`app/routes/`)
- ✅ Export `loader` for server-side data fetching
- ✅ Export default component for UI rendering
- ✅ Add authentication wrapper if protected
- ✅ Include metadata via `handle` and `meta` exports
- ✅ Add to sidebar navigation if needed

**Pattern:**

```typescript
// app/routes/(app)/my-route/route.tsx
import type { Route } from "./+types/route";

export const loader = AuthorizedLoaderWithFetcher(
  "required:permission",
  async ({ request }, fetch, user) => {
    const data = await fetch<MyData>("/api/endpoint");
    return { user, data };
  }
);

export const handle = { title: "My Route" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "My Route - App" }];
}

export default function MyRoute({ loaderData }: Route.ComponentProps) {
  const { user, data } = loaderData;
  return <div>Content</div>;
}
```

#### 3. Authentication Required?

**DO:**

- ✅ Use `AuthorizedLoaderWithFetcher(permission, fn)` for routes needing permission check + API calls
- ✅ Use `AuthorizedLoader(fn)` for routes only needing user/permissions (no API calls)
- ✅ Use `AuthorizedActionWithFetcher(permission, fn)` for form actions needing API calls
- ✅ Pass empty string `""` for permission parameter to skip permission check
- ✅ Fetcher automatically adds Bearer token to all requests
- ✅ Handle `AppResponse<T>` return type: `{ data: T | null, error?: string }`
- ✅ Check for `response.error` before using `response.data`
- ✅ Unauthorized users are auto-redirected to "/" with 302 status

**Choosing the Right Wrapper:**

| Wrapper                       | Use When                          | Parameters                           |
| ----------------------------- | --------------------------------- | ------------------------------------ |
| `AuthorizedLoader`            | Need user/permissions only        | `(args, user, permissions)`          |
| `AuthorizedLoaderWithFetcher` | Need API calls + permission check | `(args, fetcher, user, permissions)` |
| `AuthorizedActionWithFetcher` | Form actions + API calls          | `(args, fetcher, user, permissions)` |

**Complete Examples:**

```typescript
// Example 1: Simple auth check (no API calls)
export const loader = AuthorizedLoader(async (args, user, permissions) => {
  return {
    user,
    isAdmin: permissions.includes("app:admin"),
    greeting: `Welcome back, ${user.name}!`,
  };
});

// Example 2: With permission check and API call
export const loader = AuthorizedLoaderWithFetcher(
  "app:read:users", // Required permission
  async (args, fetcher, user, permissions) => {
    const response = await fetcher<User[]>("/api/users");

    if (response.error) {
      throw new Response(response.error, { status: 500 });
    }

    return { user, users: response.data };
  },
);

// Example 3: Skip permission check but use fetcher
export const loader = AuthorizedLoaderWithFetcher(
  "", // Empty string = no permission check
  async (args, fetcher, user, permissions) => {
    const response = await fetcher<Profile>(`/api/users/${user.sub}`);
    return { user, profile: response.data };
  },
);

// Example 4: Form action with API call
export const action = AuthorizedActionWithFetcher(
  "app:write:posts",
  async (args, fetcher, user, permissions) => {
    const formData = await args.request.formData();

    const response = await fetcher<Post>("/api/posts", {
      method: "POST",
      body: JSON.stringify({
        title: formData.get("title"),
        content: formData.get("content"),
        authorId: user.sub,
      }),
      headers: { "Content-Type": "application/json" },
    });

    if (response.error) {
      return json({ error: response.error }, { status: 400 });
    }

    return redirect(`/posts/${response.data.id}`);
  },
);
```

**Fetcher Response Handling:**

The authenticated fetcher returns `AppResponse<T>` type:

```typescript
type AppResponse<T> = {
  data: T | null; // Null if error or 204 No Content
  error?: string; // Error message if request failed
};

// Always check for errors first
const response = await fetcher<User[]>("/api/users");

if (response.error) {
  // Handle error: throw, return json with error, etc.
  throw new Error(response.error);
}

// Safe to use response.data (may still be null for 204 responses)
const users = response.data || [];
```

#### 4. Data Table Needed?

**Choose the Right Component:**

**Use PaginatedTable when:**

- Server-side pagination required
- Large datasets (thousands of rows)
- URL state persistence needed
- Simple CRUD operations

**Use DataTable when:**

- Client-side interactions (drag-drop)
- Smaller datasets (hundreds of rows)
- Complex view modes (tabs)
- Rich interactivity required

**PaginatedTable Example:**

```typescript
// In loader
const paginationResult = await paginateArrayFromLoader(data, request);
return { ...paginationResult };

// In component
<PaginatedTable
  data={loaderData.data}
  pagination={loaderData.pagination}
  columns={columnDef}
  newItemLink="/new"
/>
```

**DataTable Example:**

```typescript
// Pass full dataset
<DataTable data={loaderData.data} />
```

#### 5. Writing Tests?

**DO:**

- ✅ Create tests in `test/` directory
- ✅ Use `createRoutesStub` for route testing
- ✅ Mock authentication context
- ✅ Test accessibility (ARIA roles, alt text)
- ✅ Test responsive behavior
- ✅ Test error states
- ✅ Run `pnpm test` to validate

**Pattern:**

```typescript
import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import MyRoute from "~/routes/(app)/my-route/route";

describe("My Route", () => {
  it("renders data correctly", async () => {
    const RouteStub = createRoutesStub([
      {
        path: "/my-route",
        Component: MyRoute,
        loader: () => ({ user: mockUser, data: mockData }),
      },
    ]);

    render(<RouteStub initialEntries={["/my-route"]} />);

    expect(screen.getByRole("heading")).toHaveTextContent("Expected Text");
  });
});
```

---

## Common Code Patterns

### Protected Route with Data Fetching

```typescript
export const loader = AuthorizedLoaderWithFetcher(
  "app:read:todos", // Required permission
  async (args, fetcher, user, permissions) => {
    // Parallel API calls with authenticated fetcher
    const [todos, stats] = await Promise.all([
      fetcher<Todo[]>("/todos"),
      fetcher<Stats>("/stats"),
    ]);

    // Handle errors
    if (todos.error || stats.error) {
      throw new Error(todos.error || stats.error);
    }

    return {
      user,
      todos: todos.data || [],
      stats: stats.data,
    };
  },
);
```

### Permission-Based UI Rendering

```typescript
// In navigation config
const nav = [
  {
    title: "Admin Panel",
    url: "/admin",
    icon: Shield,
    permission: "admin:access",
  },
];

// Filter in component
const { permissions } = user;
const visibleItems = nav.filter((item) =>
  permissions.includes(item.permission),
);
```

### Themed Component

```typescript
<Card className="bg-card border-border">
  <CardHeader className="border-b border-border">
    <CardTitle className="text-foreground">Title</CardTitle>
  </CardHeader>
  <CardContent className="text-muted-foreground">
    Content
  </CardContent>
</Card>
```

### Server-Side Pagination

```typescript
// In loader
export const loader = async ({ request }: Route.LoaderArgs) => {
  const data = await fetchDataFromAPI();
  const result = await paginateArrayFromLoader(data, request);
  return result;
};

// Result structure:
// {
//   data: T[],           // Current page items
//   pagination: {
//     page: number,      // Current page (0-based)
//     pageSize: number,  // Items per page
//     totalPages: number,
//     totalItems: number
//   }
// }
```

### Form Action with Validation

```typescript
export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();

  // Validate with Zod
  const schema = z.object({
    title: z.string().min(1),
    completed: z.boolean(),
  });

  const result = schema.safeParse({
    title: formData.get("title"),
    completed: formData.get("completed") === "true",
  });

  if (!result.success) {
    return json({ errors: result.error.flatten() }, { status: 400 });
  }

  // Process valid data
  await saveData(result.data);
  return redirect("/success");
};
```

---

## Important Concepts

### Shadcn/ui vs Traditional Libraries

| Aspect            | Shadcn/ui                    | Traditional (MUI, Ant Design) |
| ----------------- | ---------------------------- | ----------------------------- |
| **Installation**  | Copy components to your code | `npm install library`         |
| **Location**      | `app/components/ui/`         | `node_modules/`               |
| **Customization** | Edit source directly         | Override styles/theme         |
| **Ownership**     | Full ownership               | Vendor-controlled             |
| **Updates**       | Manual (re-copy)             | `npm update`                  |
| **Bundle Size**   | Only what you use            | Entire library                |
| **Flexibility**   | Total control                | Limited to API                |

### Data Flow Architecture

```
User Request
    ↓
URL/Route
    ↓
Server Loader (SSR)
    ├─ Authentication Check
    ├─ Permission Validation
    └─ Data Fetching (with Bearer token)
    ↓
Serialize & Send to Client
    ↓
Component Renders with Data
    ↓
Client-Side Interactions (React State)
    ↓
Form Submissions → Actions → Revalidation
```

### Environment Variables

**Required for Auth0:**

See `.env.example` for the authoritative list with comments.

- `AUTH0_DOMAIN` - Your Auth0 domain (e.g., "tenant.auth0.com")
- `AUTH0_CLIENT_ID` - Application client ID
- `AUTH0_CLIENT_SECRET` - Application client secret
- `AUTH0_AUDIENCE` - Identifier of the API this app requests tokens for; without it Auth0 issues an opaque access token the backend cannot validate
- `AUTH0_MANAGEMENT_CLIENT_ID` - Management API client ID (for permissions)
- `AUTH0_MANAGEMENT_CLIENT_SECRET` - Management API client secret
- `AUTH0_MANAGEMENT_AUDIENCE` - Management API audience
- `BASE_URL` - Application base URL (for callback URL)
- `BACKEND_URL` - API base URL (for authenticated fetcher); a path prefix is preserved
- `BACKEND_LOGIN_PATH` - Endpoint notified on each sign-in so the backend can create/update its user record. `/api/auth/login` for `iluma.base-api-python`, `/User/login` for the .NET backend. Leave unset to skip the sync — the app then needs no backend to log in
- `PERMISSIONS_PREFIX` - Optional prefix to filter permissions (e.g., "app:")

⚠️ Sessions are held in the server process's memory (`app/lib/session-store.server.ts`), so the app **must run as a single instance**. A second instance cannot read the first's sessions, and every deploy signs all users out.

**Security:**

- ⚠️ Never hardcode secrets in source code
- ✅ Use `.env` file (git-ignored)
- ✅ Validate in server code only
- ✅ Never expose in client bundles

---

## File Reference Guide

| File                           | Purpose                                                         |
| ------------------------------ | --------------------------------------------------------------- |
| `app/root.tsx`                 | Root layout, theme provider, global error boundary, HTML shell  |
| `app/entry.server.tsx`         | SSR rendering logic, streaming, bot detection                   |
| `app/entry.client.tsx`         | Client-side hydration entry point                               |
| `app/routes.ts`                | Route configuration and hierarchy definition                    |
| `app/app.css`                  | Global styles, CSS variables for theming                        |
| `app/lib/auth.server.ts`       | Authentication utilities, Auth0 integration, session management |
| `app/lib/pagination.server.ts` | Server-side pagination, fuzzy search helpers                    |
| `app/lib/utils.ts`             | Utility functions (cn, etc.)                                    |
| `app/components/ui/*`          | Shadcn/ui component library (LOCAL, customizable)               |
| `app/components/layouts/*`     | Layout-level components (sidebar, tables)                       |
| `app/types/auth/index.ts`      | Authentication type definitions                                 |
| `package.json`                 | Dependencies, scripts, project metadata                         |
| `vite.config.ts`               | Vite build configuration                                        |
| `vitest.config.ts`             | Test runner configuration                                       |
| `tsconfig.json`                | TypeScript compiler options                                     |

---

## Testing Strategy

### Test Types

1. **Route Tests** - Test loaders, actions, and component rendering
2. **Component Tests** - Test UI components in isolation
3. **Integration Tests** - Test user flows (login, navigation, CRUD)
4. **Accessibility Tests** - Check ARIA attributes, keyboard navigation

### Testing Tools

- `createRoutesStub` - Mock routing context
- `render` from RTL - Render components
- `screen` queries - Find elements
- `userEvent` - Simulate user interactions
- `waitFor` - Async assertions

### Coverage Goals

- ✅ All authenticated routes have loader tests
- ✅ All forms have validation tests
- ✅ Error boundaries are tested
- ✅ Permission checks are validated
- ✅ Responsive breakpoints are verified

---

## Code Style & Conventions

### TypeScript

- ✅ Always use explicit types for function parameters and return values
- ✅ Use `Route.LoaderArgs`, `Route.ActionArgs`, `Route.ComponentProps` types
- ✅ Prefer `type` over `interface` for consistency
- ✅ Use Zod for runtime validation

### React Components

- ✅ Prefer function declarations over arrow functions for named components
- ✅ Use `React.forwardRef` for components accepting refs
- ✅ Destructure props with TypeScript types
- ✅ Use `children` prop appropriately

### CSS/Styling

- ✅ Use Tailwind utility classes exclusively
- ✅ Use theme CSS variables for colors (`bg-background`, not `bg-white`)
- ✅ Use `cn()` utility for conditional classes
- ✅ Avoid inline styles except for dynamic values
- ✅ Consider dark mode for all components

### File Naming

- ✅ Routes: `route.tsx` (required by React Router)
- ✅ Components: `kebab-case.tsx`
- ✅ Types: `index.ts` in subdirectories
- ✅ Tests: `*.test.tsx`

### Imports

- ✅ Use `~/` alias when configured (maps to `app/`)
- ✅ Group imports: React, third-party, internal, relative
- ✅ Use type imports when possible: `import type { ... }`

---

## Resources & Documentation

### Official Documentation

- [React Router v7](https://reactrouter.com/start/framework/installation) - Framework docs
- [Radix UI](https://www.radix-ui.com/primitives/docs/overview/introduction) - Primitive components
- [Shadcn/ui](https://ui.shadcn.com/docs) - Component patterns and examples
- [Tailwind CSS v4](https://tailwindcss.com/docs) - Utility classes
- [TanStack Table](https://tanstack.com/table/latest/docs/introduction) - Table API
- [DnD Kit](https://docs.dndkit.com/) - Drag and drop
- [Vitest](https://vitest.dev/) - Testing framework
- [Auth0 Docs](https://auth0.com/docs) - Authentication

### Key Concepts to Understand

- Server-Side Rendering (SSR) in React Router
- OAuth 2.0 / OIDC flow
- Headless UI components
- CSS-in-JS alternatives (why Tailwind)
- Progressive enhancement
- Type-safe routing

---

## Authentication Quick Reference

### Auth Wrappers Decision Tree

```
Need authentication?
├─ Yes → Need to make API calls?
│  ├─ Yes → Need permission check?
│  │  ├─ Yes → AuthorizedLoaderWithFetcher("permission", ...)
│  │  └─ No → AuthorizedLoaderWithFetcher("", ...)
│  └─ No → AuthorizedLoader(...)
└─ No → Regular loader (no wrapper needed)
```

### Auth Wrapper Signatures

```typescript
// 1. User and permissions only (no API calls)
AuthorizedLoader(
  (args: LoaderFunctionArgs, user: AuthUser, permissions: string[]) => Promise<T>
)

// 2. With permission check and authenticated API fetcher
AuthorizedLoaderWithFetcher(
  permission: string, // Required permission or "" to skip
  (args: LoaderFunctionArgs, fetcher: Fetcher, user: AuthUser, permissions: string[]) => Promise<T>
)

// 3. Form actions with permission check and API fetcher
AuthorizedActionWithFetcher(
  permission: string,
  (args: ActionFunctionArgs, fetcher: Fetcher, user: AuthUser, permissions: string[]) => Promise<T>
)
```

### Environment Variables Checklist

**Auth0 Configuration:**

- ✅ `AUTH0_DOMAIN` - Your Auth0 tenant domain
- ✅ `AUTH0_CLIENT_ID` - Application client ID
- ✅ `AUTH0_CLIENT_SECRET` - Application client secret
- ✅ `AUTH0_AUDIENCE` - API identifier for the issued access token
- ✅ `AUTH0_MANAGEMENT_CLIENT_ID` - For fetching permissions
- ✅ `AUTH0_MANAGEMENT_CLIENT_SECRET` - Management API secret
- ✅ `AUTH0_MANAGEMENT_AUDIENCE` - Management API audience
- ✅ `BASE_URL` - Your app's base URL (for callback)
- ✅ `BACKEND_URL` - API base URL
- ✅ `BACKEND_LOGIN_PATH` - Login-sync endpoint; optional, backend-specific
- ✅ `PERMISSIONS_PREFIX` - Optional filter (e.g., "app:")
- ✅ `SESSION_SECRET` - Signs the session cookie; **required in production**, the app refuses to boot without it

### Permission Naming Convention

Based on the code, permissions should follow this pattern:

```
{PREFIX}:{ACTION}:{RESOURCE}

Examples:
- app:read:users
- app:write:posts
- app:delete:comments
- ae:create:clients (current example in code)
```

The `PERMISSIONS_PREFIX` env var filters permissions returned from Auth0.

---

## Troubleshooting Common Issues

### "Cannot find module '@radix-ui/...'"

- **Cause:** Radix primitive not installed
- **Fix:** Check `package.json` dependencies, run `pnpm install`

### "Component not found in Shadcn/ui"

- **Cause:** Misunderstanding of Shadcn pattern
- **Fix:** Copy component from Shadcn/ui docs into `app/components/ui/`

### "Theme variables not applying"

- **Cause:** CSS variables not imported or dark class missing
- **Fix:** Ensure `app.css` is imported in `root.tsx`, check ThemeProvider

### "Loader not running on navigation"

- **Cause:** Client-side navigation caching
- **Fix:** Check if data is cached, use `revalidate()` if needed

### "Permission check failing"

- **Cause:** User object missing permissions array
- **Fix:** Verify Auth0 returns permissions, check `getAuthContext()` implementation

### "Drag and drop not working"

- **Cause:** Missing DnD context or sensors
- **Fix:** Ensure `<DndContext>` wraps table, check sensor configuration

---

## Summary

This project combines modern React patterns with SSR capabilities, robust Auth0 authentication, and a flexible Shadcn/ui + Radix UI component system. The architecture provides:

- **Security:** Route-level authentication and permission checks
- **Performance:** SSR with streaming, optimized builds
- **Accessibility:** Radix primitives ensure ARIA compliance
- **Developer Experience:** TypeScript, hot reload, comprehensive testing
- **Flexibility:** Full control over UI components without vendor lock-in
- **Scalability:** Modular architecture, clear separation of concerns

When developing new features:

1. Prioritize **type safety** (TypeScript + Zod)
2. Ensure **authentication security** (use provided wrappers)
3. Maintain **consistent styling** (Tailwind + theme variables)
4. Test **critical paths** (auth flows, data operations)
5. Consider **accessibility** (leverage Radix primitives)
6. Document **complex logic** (especially auth and permissions)

Remember: Shadcn/ui + Radix is about **composition and ownership**, not consumption. You own and modify the components to fit your exact needs.
