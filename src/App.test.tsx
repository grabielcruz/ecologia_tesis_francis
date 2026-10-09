import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import App from "./App";

const buildJsonResponse = (
  payload: unknown,
  ok: boolean = true,
  status = ok ? 200 : 400,
) =>
  Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(payload),
  } as Response);

const toBase64Url = (value: unknown) =>
  btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const buildMockJwt = (expSecondsFromNow = 3600) => {
  const header = toBase64Url({ alg: "HS256", typ: "JWT" });
  const payload = toBase64Url({
    user_id: 1,
    role: "regular",
    exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
  });

  return `${header}.${payload}.signature`;
};

describe("App UI", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    window.history.pushState({}, "", "/");
    window.scrollTo = vi.fn();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("shows guest read-only view when user is not authenticated", () => {
    const fetchMock = vi.fn(() => buildJsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(screen.getAllByText("Iniciar sesión").length).toBeGreaterThan(0);
    expect(screen.queryByText("Perfil")).not.toBeInTheDocument();
  });

  it("redirects to login when an authenticated request returns 401", async () => {
    localStorage.setItem("token", buildMockJwt(3600));
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: 2,
        name: "Regular User",
        username: "regular.user",
        email: "user@greenmetric.local",
        role: "regular",
        points: 0,
      }),
    );

    const fetchMock = vi.fn(() =>
      buildJsonResponse({ error: "Unauthorized" }, false, 401),
    );
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
    });

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("navigates from proposal summary counter to filtered proposals list", async () => {
    localStorage.setItem("token", buildMockJwt(3600));
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: 2,
        name: "Regular User",
        username: "regular.user",
        email: "user@greenmetric.local",
        role: "regular",
        points: 0,
      }),
    );

    const greenSpaces = [
      {
        id: 10,
        name: "Jardin Central",
        location: "Campus",
        totalAreaM2: 1000,
        tallTreeCount: 25,
        images: [],
        perimeterPoints: [],
      },
    ];

    const proposals = [
      {
        id: 1,
        title: "Propuesta abierta",
        description: "Abierta para votar",
        status: "open",
        totalVotes: 2,
        minimumVotesRequired: 6,
        votingStarts: "2026-01-01T00:00:00.000Z",
        votingEnds: "2026-12-31T00:00:00.000Z",
        userId: 2,
        spaceId: 10,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: 2,
        title: "Propuesta aprobada",
        description: "Ya aprobada",
        status: "approved",
        totalVotes: 5,
        minimumVotesRequired: 4,
        votingStarts: "2026-01-01T00:00:00.000Z",
        votingEnds: "2026-01-02T00:00:00.000Z",
        userId: 2,
        spaceId: 10,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-03T00:00:00.000Z",
      },
    ];

    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/green-spaces")) {
        return buildJsonResponse(greenSpaces);
      }

      if (url.includes("/api/proposals")) {
        return buildJsonResponse(proposals);
      }

      return buildJsonResponse([]);
    });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Estado de propuestas")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /en votacion abierta/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Propuestas de mejora" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Propuesta abierta")).toBeInTheDocument();
    expect(screen.queryByText("Propuesta aprobada")).not.toBeInTheDocument();
  });

  it("allows admin to validate a draft proposal with voting window", async () => {
    localStorage.setItem("token", buildMockJwt(3600));
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: 1,
        name: "Admin User",
        username: "admin",
        email: "admin@greenmetric.local",
        role: "admin",
        points: 0,
      }),
    );

    const greenSpaces = [
      {
        id: 10,
        name: "Jardin Central",
        location: "Campus",
        totalAreaM2: 1000,
        tallTreeCount: 25,
        images: [],
        perimeterPoints: [],
      },
    ];

    let proposalsData = [
      {
        id: 7,
        title: "Recuperar zona sombreada",
        description: "Agregar arboles nativos",
        status: "draft",
        totalVotes: 0,
        minimumVotesRequired: null,
        votingStarts: null,
        votingEnds: null,
        userId: 2,
        spaceId: 10,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || "GET").toUpperCase();

      if (url.includes("/api/green-spaces")) {
        return buildJsonResponse(greenSpaces);
      }

      if (url.includes("/api/proposals/7/decision") && method === "PATCH") {
        const body = JSON.parse(String(init?.body || "{}"));
        proposalsData = proposalsData.map((proposal) =>
          proposal.id === 7
            ? {
                ...proposal,
                status: "open",
                minimumVotesRequired: body.minimumVotesRequired,
                votingStarts: body.votingStarts,
                votingEnds: body.votingEnds,
              }
            : proposal,
        );

        return buildJsonResponse({
          proposal: proposalsData[0],
          project: null,
        });
      }

      if (url.includes("/api/proposals/7/project")) {
        return buildJsonResponse({
          proposal: proposalsData[0],
          project: null,
          updates: [],
        });
      }

      if (url.includes("/api/proposals")) {
        return buildJsonResponse(proposalsData);
      }

      return buildJsonResponse([]);
    });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Estado de propuestas")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Propuestas" }));

    await waitFor(() => {
      expect(screen.getByText("Recuperar zona sombreada")).toBeInTheDocument();
    });

    const proposalRow = screen
      .getByText("Recuperar zona sombreada")
      .closest("tr");
    expect(proposalRow).not.toBeNull();
    fireEvent.click(proposalRow as HTMLElement);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Detalle de propuesta",
          level: 2,
        }),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Inicio de votación"), {
      target: { value: "2027-09-01T10:00" },
    });
    fireEvent.change(screen.getByLabelText("Fin de votación"), {
      target: { value: "2027-09-10T18:00" },
    });
    fireEvent.change(screen.getByLabelText("Mínimo de votos requeridos"), {
      target: { value: "6" },
    });
    fireEvent.change(screen.getByLabelText("Duración aproximada de ejecución"), {
      target: { value: "4 semanas" },
    });
    fireEvent.change(screen.getByLabelText("Presupuesto del proyecto (USD)"), {
      target: { value: "2500" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Guardar y abrir votación" }),
    );

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([input, init]) =>
            String(input).includes("/api/proposals/7/decision") &&
            String(init?.method || "GET").toUpperCase() === "PATCH",
        ),
      ).toBe(true);
    });

    const decisionCall = fetchMock.mock.calls.find(
      ([input, init]) =>
        String(input).includes("/api/proposals/7/decision") &&
        String(init?.method || "GET").toUpperCase() === "PATCH",
    );
    expect(decisionCall).toBeDefined();

    const decisionBody = JSON.parse(String(decisionCall?.[1]?.body || "{}"));
    expect(decisionBody).toEqual(
      expect.objectContaining({
        decision: "accepted",
        minimumVotesRequired: 6,
        approximateExecutionDuration: "4 semanas",
        projectBudget: 2500,
      }),
    );
  });
});
