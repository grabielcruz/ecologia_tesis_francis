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

describe("App UI", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  it("shows guest read-only view when user is not authenticated", () => {
    const fetchMock = vi.fn(() => buildJsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(screen.getAllByText("Iniciar sesión").length).toBeGreaterThan(0);
    expect(screen.queryByText("Perfil")).not.toBeInTheDocument();
  });

  it("redirects to login when an authenticated request returns 401", async () => {
    localStorage.setItem("token", "expired-token");
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
    localStorage.setItem("token", "fake-token");
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
        screen.getByRole("heading", { name: "Propuestas" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Propuesta abierta")).toBeInTheDocument();
    expect(screen.queryByText("Propuesta aprobada")).not.toBeInTheDocument();
  });

  it("allows admin to validate a draft proposal with voting window", async () => {
    localStorage.setItem("token", "admin-token");
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

    fireEvent.change(screen.getByLabelText("Inicio de votacion"), {
      target: { value: "2026-09-01T10:00" },
    });
    fireEvent.change(screen.getByLabelText("Fin de votacion"), {
      target: { value: "2026-09-10T18:00" },
    });
    fireEvent.change(screen.getByLabelText("Minimo de votos requeridos"), {
      target: { value: "6" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Guardar y abrir votacion" }),
    );

    await waitFor(() => {
      expect(screen.getByText("open")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Finalizar votacion" }),
    ).toBeInTheDocument();
  });
});
