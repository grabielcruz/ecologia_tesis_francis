import { FormEvent, useEffect, useState } from "react";
import { AppModal } from "./components/AppModal";
import { DefaultTable, DefaultTableColumn } from "./components/DefaultTable";

interface SurveySummary {
  totalResponses: number;
  yesCount?: number;
  noCount?: number;
  average?: number;
  ratingCounts?: Record<string, number>;
}

interface Survey {
  id: number;
  title: string;
  description: string;
  active: boolean;
  type: "yesno" | "rating";
  summary?: SurveySummary;
  updatedAt?: string;
}

interface GreenSpace {
  id: number;
  name: string;
  location: string;
  totalAreaM2: number;
  tallTreeCount: number;
  images: string[];
  updatedAt?: string;
  reviewSummary?: {
    totalReviews: number;
    averageRating: number;
  };
  recentReviews?: Array<{
    username: string;
    rating: number;
    comment: string;
    updatedAt?: string;
  }>;
}

interface GreenSpaceReviewDraft {
  rating: number;
  comment: string;
}

interface Proposal {
  id: number;
  title: string;
  description: string;
  status: "draft" | "open" | "closed" | "approved" | "rejected";
  totalVotes: number;
  votingStarts: string | null;
  votingEnds: string | null;
  userId: number;
  spaceId: number;
  createdAt: string | null;
  updatedAt: string | null;
}

type ProposalStatusFilter =
  | "all"
  | "draft"
  | "open"
  | "approved"
  | "closed"
  | "rejected";

interface AdminRole {
  id: number;
  name: string;
  description: string;
}

interface AdminUser {
  id: number;
  name: string;
  username: string;
  email: string;
  isActive: boolean;
  roleId: number;
  roleName: string;
}

type SortDirection = "asc" | "desc";

function App() {
  const resolveAvatarUrl = (avatarUrl?: string | null) => {
    if (!avatarUrl) return "/default-avatar.svg";
    if (
      avatarUrl.startsWith("http://") ||
      avatarUrl.startsWith("https://") ||
      avatarUrl.startsWith("data:")
    ) {
      return avatarUrl;
    }
    if (avatarUrl.startsWith("/uploads")) {
      return `${window.location.origin}${avatarUrl}`;
    }
    return avatarUrl;
  };

  const normalizeAvatarForApi = (avatarUrl: string) => {
    if (!avatarUrl || avatarUrl.startsWith("data:")) return undefined;
    const uploadsPrefix = `${window.location.origin}/uploads`;
    if (avatarUrl.startsWith(uploadsPrefix)) {
      return avatarUrl.replace(window.location.origin, "");
    }
    return avatarUrl;
  };

  const resolveAssetUrl = (assetPath: string) => {
    if (!assetPath) return "";
    if (
      assetPath.startsWith("http://") ||
      assetPath.startsWith("https://") ||
      assetPath.startsWith("data:")
    ) {
      return assetPath;
    }
    if (assetPath.startsWith("/")) {
      return `${window.location.origin}${assetPath}`;
    }
    return assetPath;
  };

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [adminSurveyOverview, setAdminSurveyOverview] = useState<Survey[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [route, setRoute] = useState(window.location.pathname);
  const [user, setUser] = useState<{
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
    points: number;
    avatarUrl?: string;
  } | null>(null);
  const [email, setEmail] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(
    "/default-avatar.svg",
  );
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Create a data URL preview using FileReader for broader compatibility
    const reader = new FileReader();
    reader.onload = () => {
      setProfileAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // If user is authenticated, upload to server (in background)
    if (!user || !token) return;
    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await fetch(`/api/auth/profile/${user.id}/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        } as any,
        body: form,
      });
      if (!res.ok) {
        setError("No se pudo subir la imagen");
        return;
      }
      const data = await res.json();
      setProfileAvatarUrl(resolveAvatarUrl(data.avatarUrl));
      const updatedUser = { ...(user as any), avatarUrl: data.avatarUrl };
      setUser(updatedUser as any);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      setError("Error al subir la imagen");
    }
  };
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminPage, setAdminPage] = useState(1);

  useEffect(() => {
    if (!successMessage) {
      setSuccessVisible(false);
      return;
    }

    setSuccessVisible(true);
    const fadeOutTimer = window.setTimeout(() => {
      setSuccessVisible(false);
    }, 4500);
    const clearTimer = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);

    return () => {
      window.clearTimeout(fadeOutTimer);
      window.clearTimeout(clearTimer);
    };
  }, [successMessage]);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "yesno" | "rating">(
    "all",
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [userPage, setUserPage] = useState(1);
  const [answerFilter, setAnswerFilter] = useState<
    "all" | "answered" | "unanswered"
  >("all");
  const [activePollId, setActivePollId] = useState<number | null>(null);
  const [voteValue, setVoteValue] = useState("yes");
  const [submittedPollId, setSubmittedPollId] = useState<number | null>(null);
  const [pollAnswers, setPollAnswers] = useState<Record<number, string>>({});
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pollTitle, setPollTitle] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [pollType, setPollType] = useState<"yesno" | "rating">("yesno");
  const [pollActive, setPollActive] = useState(true);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [greenSpaces, setGreenSpaces] = useState<GreenSpace[]>([]);
  const [spaceName, setSpaceName] = useState("");
  const [spaceLocation, setSpaceLocation] = useState("");
  const [spaceArea, setSpaceArea] = useState("");
  const [spaceTrees, setSpaceTrees] = useState("");
  const [spaceImagesInput, setSpaceImagesInput] = useState("");
  const [uploadingSpaceImages, setUploadingSpaceImages] = useState(false);
  const [showGreenSpaceModal, setShowGreenSpaceModal] = useState(false);
  const [showGreenSpaceDetailsModal, setShowGreenSpaceDetailsModal] =
    useState(false);
  const [greenSpaceDetailsId, setGreenSpaceDetailsId] = useState<number | null>(
    null,
  );
  const [editingGreenSpace, setEditingGreenSpace] = useState<GreenSpace | null>(
    null,
  );
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userNameInput, setUserNameInput] = useState("");
  const [userUsernameInput, setUserUsernameInput] = useState("");
  const [userEmailInput, setUserEmailInput] = useState("");
  const [userPasswordInput, setUserPasswordInput] = useState("");
  const [userRoleIdInput, setUserRoleIdInput] = useState(0);
  const [userIsActiveInput, setUserIsActiveInput] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [detailsUserId, setDetailsUserId] = useState<number | null>(null);
  const [usersSortKey, setUsersSortKey] = useState<
    "name" | "username" | "email" | "roleName" | "isActive"
  >("name");
  const [usersSortDirection, setUsersSortDirection] =
    useState<SortDirection>("asc");
  const [usersTablePage, setUsersTablePage] = useState(1);
  const usersTablePageSize = 6;
  const [reviewDrafts, setReviewDrafts] = useState<
    Record<number, GreenSpaceReviewDraft>
  >({});
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalTitleInput, setProposalTitleInput] = useState("");
  const [proposalDescriptionInput, setProposalDescriptionInput] = useState("");
  const [proposalSpaceIdInput, setProposalSpaceIdInput] = useState(0);
  const [proposalActionLoadingId, setProposalActionLoadingId] = useState<
    number | null
  >(null);
  const [proposalWindows, setProposalWindows] = useState<
    Record<number, { start: string; end: string }>
  >({});
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showProposalDetailsModal, setShowProposalDetailsModal] =
    useState(false);
  const [proposalDetailsId, setProposalDetailsId] = useState<number | null>(
    null,
  );
  const [showProposalManageModal, setShowProposalManageModal] = useState(false);
  const [proposalManageId, setProposalManageId] = useState<number | null>(null);
  const [proposalStatusFilter, setProposalStatusFilter] =
    useState<ProposalStatusFilter>("all");
  const [activeGreenSpaceImageIndex, setActiveGreenSpaceImageIndex] = useState<
    Record<number, number>
  >({});
  const spaceImagePreviewList = spaceImagesInput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const navigate = (path: string, replace = false) => {
    if (window.location.pathname !== path) {
      if (replace) {
        window.history.replaceState(null, "", path);
      } else {
        window.history.pushState(null, "", path);
      }
    }
    setRoute(path);
  };

  const openProposalsWithFilter = (filter: ProposalStatusFilter) => {
    setProposalStatusFilter(filter);
    navigate("/proposals");
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const storedAnswers = localStorage.getItem(
        `pollAnswers-${parsedUser.username}`,
      );
      if (storedAnswers) {
        setPollAnswers(JSON.parse(storedAnswers));
      }
    }

    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (route === "/login" || route === "/register") {
      if (token) {
        navigate("/", true);
      }
      return;
    }

    if (!token) {
      navigate("/login", true);
    }
  }, [route, token]);

  useEffect(() => {
    if (!token) return;

    // Survey module was removed from backend; keep only active modules loading.
    if (route === "/surveys") {
      navigate("/", true);
      return;
    }

    fetchGreenSpaces();
    fetchProposals();

    if (user?.role === "admin" && route === "/admin-users") {
      fetchAdminRoles();
      fetchAdminUsers();
    }
  }, [token, route, user]);

  useEffect(() => {
    if (greenSpaces.length > 0 && proposalSpaceIdInput === 0) {
      setProposalSpaceIdInput(greenSpaces[0].id);
    }
  }, [greenSpaces, proposalSpaceIdInput]);

  useEffect(() => {
    const maxPage = Math.max(
      1,
      Math.ceil(adminUsers.length / usersTablePageSize),
    );
    if (usersTablePage > maxPage) {
      setUsersTablePage(maxPage);
    }
  }, [adminUsers, usersTablePage, usersTablePageSize]);

  const fetchGreenSpaces = async () => {
    try {
      const res = await fetch("/api/green-spaces");
      if (!res.ok) {
        setGreenSpaces([]);
        setError("No se pudieron cargar las areas verdes");
        return;
      }
      const data = await res.json();
      setGreenSpaces(Array.isArray(data) ? data : []);
    } catch {
      setGreenSpaces([]);
      setError("No se pudieron cargar las areas verdes");
    }
  };

  const fetchProposals = async () => {
    if (!token) return;

    try {
      const res = await fetch("/api/proposals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setProposals([]);
        setError("No se pudieron cargar las propuestas");
        return;
      }

      const data = await res.json();
      setProposals(Array.isArray(data) ? data : []);
    } catch {
      setProposals([]);
      setError("No se pudieron cargar las propuestas");
    }
  };

  const fetchSurveys = async () => {
    try {
      const res = await fetch("/api/surveys?active=true&page=1&limit=1000");
      if (!res.ok) {
        setSurveys([]);
        setUserPage(1);
        setError("El modulo de encuestas aun no esta disponible");
        return;
      }
      const data = await res.json();
      const surveyList = Array.isArray(data?.surveys)
        ? data.surveys
        : Array.isArray(data)
          ? data
          : [];
      setSurveys(surveyList);
      setUserPage(1);
    } catch {
      setSurveys([]);
      setError("No se pudieron cargar las encuestas");
    }
  };

  const fetchAdminRoles = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setAdminRoles([]);
        setError("No se pudieron cargar los roles");
        return;
      }
      const data = await res.json();
      const roleList = Array.isArray(data) ? data : [];
      setAdminRoles(roleList);
      if (roleList.length > 0 && !editingUserId && userRoleIdInput === 0) {
        setUserRoleIdInput(Number(roleList[0].id) || 0);
      }
    } catch {
      setAdminRoles([]);
      setError("No se pudieron cargar los roles");
    }
  };

  const fetchAdminUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setAdminUsers([]);
        setError("No se pudieron cargar los usuarios");
        return;
      }
      const data = await res.json();
      setAdminUsers(Array.isArray(data) ? data : []);
    } catch {
      setAdminUsers([]);
      setError("No se pudieron cargar los usuarios");
    }
  };

  const fetchAdminSurveys = async (page: number) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        admin: "true",
      });

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }
      if (filterType !== "all") {
        params.set("type", filterType);
      }
      if (filterStatus !== "all") {
        params.set("status", filterStatus);
      }
      params.set("sort", sortOrder);

      const res = await fetch(`/api/surveys?${params.toString()}`);
      if (!res.ok) {
        setSurveys([]);
        setTotalPages(1);
        setError(
          "El modulo de encuestas de administrador aun no esta disponible",
        );
        return;
      }
      const data = await res.json();
      const surveyList = Array.isArray(data?.surveys) ? data.surveys : [];
      setSurveys(surveyList);
      setTotalPages(
        typeof data?.totalPages === "number" && data.totalPages > 0
          ? data.totalPages
          : 1,
      );
    } catch {
      setSurveys([]);
      setTotalPages(1);
      setError("No se pudieron cargar las encuestas de administrador");
    }
  };

  const fetchAdminSurveyOverview = async () => {
    try {
      const res = await fetch(
        "/api/surveys?admin=true&page=1&limit=1000&sort=desc",
      );
      if (!res.ok) {
        setAdminSurveyOverview([]);
        return;
      }
      const data = await res.json();
      setAdminSurveyOverview(Array.isArray(data?.surveys) ? data.surveys : []);
    } catch {
      setAdminSurveyOverview([]);
      // Keep UI functional even if overview fails.
    }
  };

  const login = async () => {
    setError(null);
    setSuccessMessage(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      setError("Usuario o contraseña incorrectos");
      return;
    }

    const data = await response.json();
    setToken(data.token);
    const loggedUser = data.user;
    setUser(loggedUser);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    const storedAnswers = localStorage.getItem(
      `pollAnswers-${data.user.username}`,
    );
    if (storedAnswers) {
      setPollAnswers(JSON.parse(storedAnswers));
    } else {
      setPollAnswers({});
    }
    navigate("/");
  };

  const register = async () => {
    setError(null);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: registerName, username, password, email }),
    });

    if (!response.ok) {
      setError("No se pudo crear la cuenta");
      return;
    }

    const data = await response.json();
    const regUser = data;
    setUser(regUser);
    setToken(null);
    setPassword("");
    setRegisterName("");
    setEmail("");
    setUsername(data.username);
    setSuccessMessage("Registro exitoso. Ahora ingresa con tu usuario.");
    navigate("/login");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setSurveys([]);
    setAdminSurveyOverview([]);
    setGreenSpaces([]);
    setProposals([]);
    setUsername("");
    setPassword("");
    setError(null);
    setAdminPage(1);
    setTotalPages(1);
    setPollTitle("");
    setPollDescription("");
    setPollType("yesno");
    setPollActive(true);
    setEditingSurvey(null);
    resetGreenSpaceForm();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const displayName = user ? `${user.name}` : "";

  const formatUpdatedAt = (value?: string | Date) => {
    if (!value) return "Sin fecha";
    const date = typeof value === "string" ? new Date(value) : value;
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const answeredPolls = surveys.filter((survey) =>
    Boolean(pollAnswers[survey.id]),
  ).length;
  const unansweredPolls = surveys.length - answeredPolls;
  const filteredSurveys = surveys.filter((survey) => {
    if (answerFilter === "answered") {
      return Boolean(pollAnswers[survey.id]);
    }
    if (answerFilter === "unanswered") {
      return !pollAnswers[survey.id];
    }
    return true;
  });

  const userTotalPages = Math.max(1, Math.ceil(filteredSurveys.length / limit));
  const safeUserPage = Math.min(userPage, userTotalPages);
  const pagedSurveys = filteredSurveys.slice(
    (safeUserPage - 1) * limit,
    safeUserPage * limit,
  );

  const sortedAdminUsers = [...adminUsers].sort((a, b) => {
    const key = usersSortKey;
    if (key === "isActive") {
      const left = a.isActive ? 1 : 0;
      const right = b.isActive ? 1 : 0;
      return usersSortDirection === "asc" ? left - right : right - left;
    }

    const left = String(a[key] ?? "").toLowerCase();
    const right = String(b[key] ?? "").toLowerCase();
    const comparison = left.localeCompare(right, "es", { sensitivity: "base" });
    return usersSortDirection === "asc" ? comparison : -comparison;
  });

  const usersTableTotalPages = Math.max(
    1,
    Math.ceil(sortedAdminUsers.length / usersTablePageSize),
  );
  const safeUsersTablePage = Math.min(usersTablePage, usersTableTotalPages);
  const pagedAdminUsers = sortedAdminUsers.slice(
    (safeUsersTablePage - 1) * usersTablePageSize,
    safeUsersTablePage * usersTablePageSize,
  );

  const handleUsersSort = (key: string) => {
    const normalized = key as
      | "name"
      | "username"
      | "email"
      | "roleName"
      | "isActive";
    if (usersSortKey === normalized) {
      setUsersSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setUsersSortKey(normalized);
      setUsersSortDirection("asc");
    }
    setUsersTablePage(1);
  };
  const isGreenSpacesRoute =
    route === "/green-spaces" || route.startsWith("/green-spaces/");
  const selectedGreenSpaceId = (() => {
    if (!route.startsWith("/green-spaces/")) return null;
    const id = Number(route.split("/")[2]);
    return Number.isFinite(id) ? id : null;
  })();
  const selectedGreenSpace = selectedGreenSpaceId
    ? greenSpaces.find((space) => space.id === selectedGreenSpaceId) || null
    : null;
  const pageTitle =
    route === "/"
      ? "Principal"
      : route === "/profile"
        ? "Mi perfil"
        : route === "/proposals"
          ? "Propuestas"
          : route === "/admin-users"
            ? "Usuarios"
            : route.startsWith("/green-spaces/")
              ? "Detalle de area verde"
              : route === "/green-spaces"
                ? "Areas verdes del campus"
                : "Principal";
  const pageSubtitle =
    route === "/"
      ? "Resumen general de encuestas y areas verdes"
      : route === "/profile"
        ? "Actualiza tus datos personales"
        : route === "/proposals"
          ? "Consulta, valida y vota propuestas de mejora para areas verdes"
          : route === "/admin-users"
            ? "Gestion integral de usuarios del sistema"
            : route.startsWith("/green-spaces/")
              ? "Informacion completa, resenas y sugerencias del espacio"
              : route === "/green-spaces"
                ? "Registro y consulta de espacios verdes universitarios"
                : `Bienvenido${displayName ? `, ${displayName}` : ""}`;

  const resetAdminForm = () => {
    setEditingSurvey(null);
    setPollTitle("");
    setPollDescription("");
    setPollType("yesno");
    setPollActive(true);
  };

  const saveSurvey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const payload: Record<string, unknown> = {
      title: pollTitle,
      description: pollDescription,
    };

    payload.active = pollActive;

    if (!editingSurvey) {
      payload.type = pollType;
    }

    try {
      const method = editingSurvey ? "PUT" : "POST";
      const url = editingSurvey
        ? `/api/surveys/${editingSurvey.id}`
        : "/api/surveys";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError("No se pudo guardar la encuesta");
        return;
      }

      resetAdminForm();
      setShowModal(false);
      fetchAdminSurveys(adminPage);
      fetchAdminSurveyOverview();
    } catch {
      setError("No se pudo guardar la encuesta");
    }
  };

  const editSurvey = (survey: Survey) => {
    setEditingSurvey(survey);
    setPollTitle(survey.title);
    setPollDescription(survey.description);
    setPollType(survey.type);
    setPollActive(survey.active);
    setShowModal(true);
  };

  const cancelEdit = () => {
    resetAdminForm();
    setShowModal(false);
  };

  const openCreateModal = () => {
    resetAdminForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetAdminForm();
  };

  const resetGreenSpaceForm = () => {
    setEditingGreenSpace(null);
    setSpaceName("");
    setSpaceLocation("");
    setSpaceArea("");
    setSpaceTrees("");
    setSpaceImagesInput("");
    setUploadingSpaceImages(false);
  };

  const openCreateGreenSpaceModal = () => {
    resetGreenSpaceForm();
    setShowGreenSpaceModal(true);
  };

  const openGreenSpaceDetailsModal = (space: GreenSpace) => {
    setGreenSpaceDetailsId(space.id);
    setShowGreenSpaceDetailsModal(true);
  };

  const closeGreenSpaceDetailsModal = () => {
    setShowGreenSpaceDetailsModal(false);
    setGreenSpaceDetailsId(null);
  };

  const closeGreenSpaceModal = () => {
    setShowGreenSpaceModal(false);
    resetGreenSpaceForm();
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setUserNameInput("");
    setUserUsernameInput("");
    setUserEmailInput("");
    setUserPasswordInput("");
    setUserRoleIdInput(adminRoles[0]?.id || 0);
    setUserIsActiveInput(true);
  };

  const openCreateUserModal = () => {
    resetUserForm();
    setShowUserModal(true);
  };

  const openEditUserModal = (entry: AdminUser) => {
    setEditingUserId(entry.id);
    setUserNameInput(entry.name);
    setUserUsernameInput(entry.username);
    setUserEmailInput(entry.email);
    setUserPasswordInput("");
    setUserRoleIdInput(entry.roleId);
    setUserIsActiveInput(entry.isActive);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    resetUserForm();
  };

  const openUserDetailsModal = (entry: AdminUser) => {
    setDetailsUserId(entry.id);
    setShowUserDetailsModal(true);
  };

  const closeUserDetailsModal = () => {
    setShowUserDetailsModal(false);
    setDetailsUserId(null);
  };

  const openCreateProposalModal = () => {
    setProposalTitleInput("");
    setProposalDescriptionInput("");
    setShowProposalModal(true);
  };

  const closeCreateProposalModal = () => {
    setShowProposalModal(false);
  };

  const openProposalDetailsModal = (proposal: Proposal) => {
    setProposalDetailsId(proposal.id);
    setShowProposalDetailsModal(true);
  };

  const closeProposalDetailsModal = () => {
    setShowProposalDetailsModal(false);
    setProposalDetailsId(null);
  };

  const openProposalManageModal = (proposal: Proposal) => {
    setProposalManageId(proposal.id);
    setShowProposalManageModal(true);
  };

  const closeProposalManageModal = () => {
    setShowProposalManageModal(false);
    setProposalManageId(null);
  };

  const saveAdminUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const editingUser = adminUsers.find((entry) => entry.id === editingUserId);
    const isOriginalAdminUser = editingUser?.username === "admin";

    const payload: Record<string, unknown> = {
      name: userNameInput,
      username: userUsernameInput,
      email: userEmailInput,
      isActive: userIsActiveInput,
    };

    if (!isOriginalAdminUser) {
      payload.roleId = userRoleIdInput;
    }

    if (userPasswordInput.trim()) {
      payload.password = userPasswordInput;
    }

    try {
      const res = await fetch(
        editingUserId
          ? `/api/admin/users/${editingUserId}`
          : "/api/admin/users",
        {
          method: editingUserId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo guardar el usuario");
        return;
      }

      setSuccessMessage(
        editingUserId
          ? "Usuario actualizado correctamente."
          : "Usuario creado correctamente.",
      );
      setError(null);
      resetUserForm();
      setShowUserModal(false);
      fetchAdminUsers();
    } catch {
      setError("No se pudo guardar el usuario");
    }
  };

  const deleteAdminUser = async (userId: number) => {
    if (!token) return;

    const targetUser = adminUsers.find((entry) => entry.id === userId);
    if (targetUser?.username === "admin") {
      setError("No se puede eliminar el usuario administrador original");
      return;
    }

    if (
      !window.confirm(
        "Esta accion eliminara el usuario de forma permanente. Continuar?",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo eliminar el usuario");
        return;
      }

      if (editingUserId === userId) {
        resetUserForm();
        setShowUserModal(false);
      }
      setSuccessMessage("Usuario eliminado correctamente.");
      setError(null);
      fetchAdminUsers();
    } catch {
      setError("No se pudo eliminar el usuario");
    }
  };

  const uploadGreenSpaceImages = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (!token) {
      setError("Solo administradores pueden subir imagenes");
      return;
    }

    setUploadingSpaceImages(true);
    setError(null);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("images", file));

      const response = await fetch("/api/green-spaces/images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        setError("No se pudieron subir las imagenes");
        return;
      }

      const data = await response.json();
      const uploadedPaths = Array.isArray(data.images)
        ? data.images.map((img: string) => img.trim()).filter(Boolean)
        : [];

      if (uploadedPaths.length > 0) {
        setSpaceImagesInput((prev) => {
          const current = prev
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
          const merged = [...new Set([...current, ...uploadedPaths])];
          return merged.join("\n");
        });
      }
      event.target.value = "";
    } catch {
      setError("No se pudieron subir las imagenes");
    } finally {
      setUploadingSpaceImages(false);
    }
  };

  const saveGreenSpace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Solo administradores pueden registrar areas verdes");
      return;
    }

    const images = spaceImagesInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (images.length === 0) {
      setError("Debes subir al menos una imagen desde tu equipo");
      return;
    }

    const payload = {
      name: spaceName,
      location: spaceLocation,
      totalAreaM2: Number(spaceArea) || 0,
      tallTreeCount: Number(spaceTrees) || 0,
      images,
    };

    try {
      const method = editingGreenSpace ? "PUT" : "POST";
      const url = editingGreenSpace
        ? `/api/green-spaces/${editingGreenSpace.id}`
        : "/api/green-spaces";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError("No se pudo guardar el area verde");
        return;
      }

      resetGreenSpaceForm();
      setShowGreenSpaceModal(false);
      fetchGreenSpaces();
      setSuccessMessage(
        editingGreenSpace
          ? "Area verde actualizada correctamente."
          : "Area verde registrada correctamente.",
      );
      setError(null);
    } catch {
      setError("No se pudo guardar el area verde");
    }
  };

  const editGreenSpace = (space: GreenSpace) => {
    setEditingGreenSpace(space);
    setSpaceName(space.name);
    setSpaceLocation(space.location);
    setSpaceArea(String(space.totalAreaM2));
    setSpaceTrees(String(space.tallTreeCount));
    setSpaceImagesInput((space.images || []).join("\n"));
    setShowGreenSpaceModal(true);
  };

  const deleteGreenSpace = async (id: number) => {
    if (!token) {
      setError("Solo administradores pueden eliminar areas verdes");
      return;
    }

    try {
      const response = await fetch(`/api/green-spaces/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setError("No se pudo eliminar el area verde");
        return;
      }

      if (editingGreenSpace?.id === id) {
        resetGreenSpaceForm();
      }
      fetchGreenSpaces();
      setSuccessMessage("Area verde eliminada correctamente.");
      setError(null);
    } catch {
      setError("No se pudo eliminar el area verde");
    }
  };

  const updateGreenSpaceReviewDraft = (
    greenSpaceId: number,
    patch: Partial<GreenSpaceReviewDraft>,
  ) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [greenSpaceId]: {
        rating: prev[greenSpaceId]?.rating ?? 0,
        comment: prev[greenSpaceId]?.comment ?? "",
        ...patch,
      },
    }));
  };

  const submitProposal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    if (!proposalTitleInput.trim() || !proposalDescriptionInput.trim()) {
      setError("Completa titulo y descripcion de la propuesta");
      return;
    }

    if (!Number.isFinite(proposalSpaceIdInput) || proposalSpaceIdInput <= 0) {
      setError("Selecciona un area verde valida para la propuesta");
      return;
    }

    setIsSubmittingProposal(true);
    setError(null);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: proposalTitleInput.trim(),
          description: proposalDescriptionInput.trim(),
          spaceId: proposalSpaceIdInput,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo registrar la propuesta");
        return;
      }

      setProposalTitleInput("");
      setProposalDescriptionInput("");
      setShowProposalModal(false);
      setSuccessMessage(
        "Propuesta enviada. Queda pendiente de validacion administrativa.",
      );
      await fetchProposals();
    } catch {
      setError("No se pudo registrar la propuesta");
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const voteProposal = async (proposalId: number) => {
    if (!token) return;
    setProposalActionLoadingId(proposalId);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/votes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo votar la propuesta");
        return;
      }

      setSuccessMessage("Voto registrado correctamente.");
      await fetchProposals();
    } catch {
      setError("No se pudo votar la propuesta");
    } finally {
      setProposalActionLoadingId(null);
    }
  };

  const decideProposal = async (
    proposalId: number,
    decision: "accepted" | "rejected",
  ) => {
    if (!token) return;
    setProposalActionLoadingId(proposalId);
    setError(null);
    const windowInput = proposalWindows[proposalId] || { start: "", end: "" };
    const payload: Record<string, unknown> = { decision };
    if (decision === "accepted") {
      payload.votingStarts = windowInput.start;
      payload.votingEnds = windowInput.end;
    }

    try {
      const res = await fetch(`/api/proposals/${proposalId}/decision`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo actualizar la propuesta");
        return;
      }

      setSuccessMessage(
        decision === "accepted"
          ? "Propuesta validada y habilitada para votacion."
          : "Propuesta rechazada.",
      );
      await fetchProposals();
    } catch {
      setError("No se pudo actualizar la propuesta");
    } finally {
      setProposalActionLoadingId(null);
    }
  };

  const finalizeProposal = async (proposalId: number) => {
    if (!token) return;
    setProposalActionLoadingId(proposalId);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/finalize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo finalizar la propuesta");
        return;
      }

      setSuccessMessage("Proceso de votacion finalizado para la propuesta.");
      await fetchProposals();
    } catch {
      setError("No se pudo finalizar la propuesta");
    } finally {
      setProposalActionLoadingId(null);
    }
  };

  const submitGreenSpaceReview = async (greenSpaceId: number) => {
    if (!token) {
      setError("Debes iniciar sesion para enviar una resena");
      return;
    }

    const draft = reviewDrafts[greenSpaceId] || { rating: 0, comment: "" };
    if (draft.rating < 0 || draft.rating > 5) {
      setError("La calificacion debe estar entre 0 y 5 estrellas");
      return;
    }

    if (!draft.comment.trim()) {
      setError("Debes escribir un comentario o sugerencia");
      return;
    }

    try {
      const res = await fetch(`/api/green-spaces/${greenSpaceId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: draft.rating,
          comment: draft.comment.trim(),
        }),
      });

      if (!res.ok) {
        setError("No se pudo guardar tu resena");
        return;
      }

      setSuccessMessage("Resena guardada correctamente.");
      setError(null);
      setReviewDrafts((prev) => ({
        ...prev,
        [greenSpaceId]: { rating: draft.rating, comment: "" },
      }));
      fetchGreenSpaces();
    } catch {
      setError("No se pudo guardar tu resena");
    }
  };

  const renderAverageStars = (average: number) => {
    const safeAverage = Math.max(0, Math.min(5, average || 0));
    const fillPercent = (safeAverage / 5) * 100;

    return (
      <div
        className="avg-stars"
        aria-label={`Calificacion promedio ${safeAverage.toFixed(1)} de 5`}
      >
        <span className="stars-base">★★★★★</span>
        <span className="stars-fill" style={{ width: `${fillPercent}%` }}>
          ★★★★★
        </span>
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <AppModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingSurvey ? "Editar encuesta" : "Nueva encuesta"}
        description={
          editingSurvey
            ? "Ajusta los datos y guarda los cambios."
            : "Crea una nueva encuesta para tu campus."
        }
      >
        <form className="admin-form" onSubmit={saveSurvey}>
          <div className="field-row">
            <label>
              Título
              <input
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
                placeholder="Título de la encuesta"
                required
              />
            </label>
            {!editingSurvey && (
              <label>
                Tipo de encuesta
                <select
                  value={pollType}
                  onChange={(e) =>
                    setPollType(e.target.value as "yesno" | "rating")
                  }
                >
                  <option value="yesno">Sí / No</option>
                  <option value="rating">Valoración 1–5</option>
                </select>
              </label>
            )}
          </div>

          <label>
            Descripción
            <textarea
              value={pollDescription}
              onChange={(e) => setPollDescription(e.target.value)}
              placeholder="Describe el objetivo de la encuesta"
              required
            />
          </label>

          <div className="field-row modal-actions-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={pollActive}
                onChange={(e) => setPollActive(e.target.checked)}
              />
              Visible
            </label>
            <div className="button-row">
              <button type="submit">
                {editingSurvey ? "Actualizar" : "Crear"}
              </button>
              <button type="button" className="secondary" onClick={closeModal}>
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </AppModal>
    );
  };

  const renderUserModal = () => {
    if (!showUserModal) return null;

    const editingUser = adminUsers.find((entry) => entry.id === editingUserId);
    const isOriginalAdminUser = editingUser?.username === "admin";

    return (
      <AppModal
        isOpen={showUserModal}
        onClose={closeUserModal}
        title={editingUserId ? "Editar usuario" : "Crear usuario"}
        description={
          editingUserId
            ? "Actualiza datos del usuario o elimina si no tiene registros relacionados."
            : "Completa la informacion para crear un nuevo usuario del sistema."
        }
      >
        <form className="admin-form" onSubmit={saveAdminUser}>
          <div className="field-row">
            <label>
              Nombre
              <input
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                required
              />
            </label>
            <label>
              Usuario
              <input
                value={userUsernameInput}
                onChange={(e) => setUserUsernameInput(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="field-row">
            <label>
              Correo
              <input
                type="email"
                value={userEmailInput}
                onChange={(e) => setUserEmailInput(e.target.value)}
                required
              />
            </label>
            <label>
              Contrasena {editingUserId ? "(opcional)" : ""}
              <input
                type="password"
                value={userPasswordInput}
                onChange={(e) => setUserPasswordInput(e.target.value)}
                required={!editingUserId}
              />
            </label>
          </div>

          <div className="field-row">
            {!isOriginalAdminUser && (
              <label>
                Rol
                <select
                  value={String(userRoleIdInput)}
                  onChange={(e) => setUserRoleIdInput(Number(e.target.value))}
                  required
                >
                  <option value="0" disabled>
                    Selecciona un rol
                  </option>
                  {adminRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={userIsActiveInput}
                onChange={(e) => setUserIsActiveInput(e.target.checked)}
              />
              Usuario activo
            </label>
          </div>

          <div className="button-row user-modal-actions">
            <button type="submit">
              {editingUserId ? "Guardar cambios" : "Crear usuario"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={closeUserModal}
            >
              Cancelar
            </button>
            {editingUserId && !isOriginalAdminUser && (
              <button
                type="button"
                className="danger"
                onClick={() => deleteAdminUser(editingUserId)}
              >
                Eliminar usuario
              </button>
            )}
          </div>
        </form>
      </AppModal>
    );
  };

  const renderUserDetailsModal = () => {
    if (!showUserDetailsModal) return null;

    const targetUser = adminUsers.find((entry) => entry.id === detailsUserId);
    if (!targetUser) return null;

    return (
      <AppModal
        isOpen={showUserDetailsModal}
        onClose={closeUserDetailsModal}
        title="Detalle de usuario"
        description="Informacion completa del registro seleccionado."
      >
        <div className="admin-form">
          <div className="field-row">
            <label>
              Nombre
              <input value={targetUser.name} readOnly disabled />
            </label>
            <label>
              Usuario
              <input value={targetUser.username} readOnly disabled />
            </label>
          </div>

          <div className="field-row">
            <label>
              Correo
              <input value={targetUser.email} readOnly disabled />
            </label>
            <label>
              Rol
              <input value={targetUser.roleName} readOnly disabled />
            </label>
          </div>

          <div className="field-row">
            <label>
              Estado
              <input
                value={targetUser.isActive ? "Activo" : "Inactivo"}
                readOnly
                disabled
              />
            </label>
          </div>

          <div className="button-row user-modal-actions">
            <button
              type="button"
              className="secondary"
              onClick={closeUserDetailsModal}
            >
              Cerrar
            </button>
          </div>
        </div>
      </AppModal>
    );
  };

  const deleteSurvey = async (id: number) => {
    setError(null);
    try {
      const response = await fetch(`/api/surveys/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setError("No se pudo eliminar la encuesta");
        return;
      }

      if (surveys.length === 1 && adminPage > 1) {
        setAdminPage(adminPage - 1);
      } else {
        fetchAdminSurveys(adminPage);
      }
      fetchAdminSurveyOverview();
    } catch {
      setError("No se pudo eliminar la encuesta");
    }
  };

  const submitResponse = async (survey: Survey) => {
    if (!user) {
      setError("Debes iniciar sesión para responder la encuesta");
      return;
    }

    setError(null);
    const answerPayload = survey.type === "yesno" ? voteValue : voteValue;

    try {
      const response = await fetch(`/api/surveys/${survey.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          answers: JSON.stringify({ answer: answerPayload }),
        }),
      });

      if (!response.ok) {
        setError("No se pudo enviar tu respuesta");
        return;
      }

      setSubmittedPollId(survey.id);
      setActivePollId(null);
      setVoteValue(survey.type === "yesno" ? "yes" : "3");
      setPollAnswers((prev) => {
        const next = { ...prev, [survey.id]: answerPayload };
        if (user) {
          localStorage.setItem(
            `pollAnswers-${user.username}`,
            JSON.stringify(next),
          );
        }
        return next;
      });
    } catch {
      setError("No se pudo enviar tu respuesta");
    }
  };

  const loadProfileForm = () => {
    if (!user) return;
    setProfileName(user.name);
    setProfileUsername(user.username);
    setProfileEmail(user.email);
    setProfileAvatarUrl(resolveAvatarUrl(user.avatarUrl));
    setIsProfileEditing(false);
  };

  useEffect(() => {
    if (route === "/profile") {
      loadProfileForm();
    }
  }, [route, user]);

  const cancelProfileEditing = () => {
    loadProfileForm();
    setError(null);
  };

  const updateProfile = async () => {
    if (!user || !token) return;
    try {
      const avatarUrl = normalizeAvatarForApi(profileAvatarUrl);
      const payload: any = {
        name: profileName,
        username: profileUsername,
        email: profileEmail,
      };

      if (avatarUrl) {
        payload.avatarUrl = avatarUrl;
      }

      const res = await fetch(`/api/auth/profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setError("No se pudo actualizar el perfil");
        return;
      }

      const updated = await res.json();
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      setError(null);
      setSuccessMessage("Perfil actualizado correctamente.");
      navigate("/");
    } catch {
      setError("No se pudo actualizar el perfil");
    }
  };

  const openPasswordModal = () => {
    setPasswordError(null);
    setPasswordSuccess(null);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordError(null);
    setPasswordSuccess(null);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const changePassword = async () => {
    if (!user || !token) return;
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordError("Por favor completa todos los campos.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      const res = await fetch(`/api/auth/profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPasswordError(data.error || "No se pudo actualizar la contraseña.");
        return;
      }

      setPasswordSuccess("Contraseña actualizada correctamente.");
      setPasswordError(null);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => {
        closePasswordModal();
      }, 1600);
    } catch {
      setPasswordError("No se pudo actualizar la contraseña.");
    }
  };

  if (route === "/login") {
    return (
      <div className="container">
        <h1>Encuestas de sostenibilidad</h1>
        <section className="box login-box">
          <h2>Iniciar sesión</h2>
          <div className="input-group">
            <label className="input-with-icon">
              <input
                placeholder="Usuario"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
          </div>
          <div className="input-group">
            <label className="input-with-icon">
              <input
                placeholder="Contraseña"
                type={showPasswordField ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPasswordField((visible) => !visible)}
                aria-label={
                  showPasswordField
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {showPasswordField ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 4l16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </button>
            </label>
          </div>
          <button onClick={login}>Entrar</button>
          {successMessage && (
            <p className={`success-message${successVisible ? " visible" : ""}`}>
              {successMessage}
            </p>
          )}
          {error && <p className="error">{error}</p>}
          <p>
            No tienes cuenta?{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => navigate("/register")}
            >
              Regístrate
            </button>
          </p>
        </section>
      </div>
    );
  }

  if (route === "/register") {
    return (
      <div className="container">
        <h1>Registro de usuario</h1>
        <section className="box">
          <h2>Crea tu cuenta</h2>
          <label>
            Nombre completo
            <input
              placeholder="Nombre completo"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
            />
          </label>
          <label>
            Nombre de usuario
            <input
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label>
            Correo
            <input
              placeholder="Correo"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Contraseña
            <input
              placeholder="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button onClick={register}>Registrarse</button>
          <button
            type="button"
            className="secondary"
            onClick={() => navigate("/login")}
          >
            Volver al login
          </button>
          {error && <p className="error">{error}</p>}
        </section>
      </div>
    );
  }

  const renderProfileSection = () => (
    <section className="box profile-box">
      <h2>Mi perfil</h2>
      <div className="profile-avatar-row">
        <div className="profile-avatar-preview">
          <img
            src={profileAvatarUrl || "/default-avatar.svg"}
            alt="Avatar preview"
          />
        </div>
        <div className="profile-avatar-controls">
          <label className="small">Subir imagen</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarFile}
            disabled={!isProfileEditing}
          />
          <p className="muted">
            O pega una URL en el campo Avatar URL más abajo.
          </p>
        </div>
      </div>
      <label>
        Nombre completo
        <input
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          readOnly={!isProfileEditing}
          disabled={!isProfileEditing}
        />
      </label>
      <label>
        Nombre de usuario
        <input
          value={profileUsername}
          onChange={(e) => setProfileUsername(e.target.value)}
          readOnly={!isProfileEditing}
          disabled={!isProfileEditing}
        />
      </label>
      <label>
        Correo
        <input
          value={profileEmail}
          onChange={(e) => setProfileEmail(e.target.value)}
          readOnly={!isProfileEditing}
          disabled={!isProfileEditing}
        />
      </label>
      <label>
        Avatar URL
        <input
          value={profileAvatarUrl}
          onChange={(e) => setProfileAvatarUrl(e.target.value)}
          placeholder="https://..."
          readOnly={!isProfileEditing}
          disabled={!isProfileEditing}
        />
      </label>
      <div className="button-row">
        {!isProfileEditing ? (
          <button type="button" onClick={() => setIsProfileEditing(true)}>
            Editar perfil
          </button>
        ) : (
          <>
            <button type="button" onClick={updateProfile}>
              Guardar cambios
            </button>
            <button
              type="button"
              className="secondary"
              onClick={cancelProfileEditing}
            >
              Cancelar
            </button>
          </>
        )}
        {isProfileEditing && (
          <button
            type="button"
            className="secondary"
            onClick={openPasswordModal}
          >
            Cambiar contraseña
          </button>
        )}
        <button
          type="button"
          className="secondary"
          onClick={() => navigate("/")}
        >
          Volver
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );

  const renderPasswordModal = () => {
    if (!showPasswordModal) return null;

    return (
      <AppModal
        isOpen={showPasswordModal}
        onClose={closePasswordModal}
        title="Cambiar contraseña"
        description="Ingresa tu contraseña actual y la nueva contraseña."
      >
        <div className="admin-form">
          <label>
            Contraseña actual
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Contraseña actual"
            />
          </label>
          <label>
            Nueva contraseña
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña"
            />
          </label>
          <label>
            Confirmar nueva contraseña
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
            />
          </label>
          {passwordSuccess && (
            <p className="modal-success">{passwordSuccess}</p>
          )}
          {passwordError && <p className="error">{passwordError}</p>}
          <div className="button-row">
            <button type="button" onClick={changePassword}>
              Guardar contraseña
            </button>
            <button
              type="button"
              className="secondary"
              onClick={closePasswordModal}
            >
              Cancelar
            </button>
          </div>
        </div>
      </AppModal>
    );
  };

  const renderAdminPanel = () => (
    <section className="box admin-box">
      <div className="admin-header">
        <div>
          <h2>Gestión de encuestas</h2>
          <p>Crea, edita y elimina encuestas con opción de paginación.</p>
        </div>
        <div className="admin-controls">
          <button type="button" onClick={openCreateModal}>
            Nueva encuesta
          </button>
        </div>
      </div>

      <div className="filter-row">
        <input
          value={searchTerm}
          onChange={(e) => {
            const value = e.target.value;
            setSearchTerm(value);
            setAdminPage(1);
          }}
          placeholder="Buscar por título o descripción"
        />
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value as "all" | "yesno" | "rating");
            setAdminPage(1);
          }}
        >
          <option value="all">Todos los tipos</option>
          <option value="yesno">Sí / No</option>
          <option value="rating">Valoración 1–5</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value as "all" | "active" | "inactive");
            setAdminPage(1);
          }}
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value as "desc" | "asc");
            setAdminPage(1);
          }}
        >
          <option value="desc">Más recientes primero</option>
          <option value="asc">Más antiguas primero</option>
        </select>
      </div>

      <div className="admin-table">
        {surveys.length === 0 ? (
          <p>No hay encuestas disponibles.</p>
        ) : (
          surveys.map((survey) => (
            <article key={survey.id} className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">
                  <h3>{survey.title}</h3>
                  <p>{survey.description}</p>
                  <p className="poll-updated">
                    Última actualización: {formatUpdatedAt(survey.updatedAt)}
                  </p>
                </div>
                <div className="pill-group">
                  <span
                    className={`pill ${survey.active ? "active" : "inactive"}`}
                  >
                    {survey.active ? "Activa" : "Inactiva"}
                  </span>
                  <span
                    className={`pill ${survey.type === "rating" ? "rating" : "active"}`}
                  >
                    {survey.type === "rating" ? "Valoración 1–5" : "Sí / No"}
                  </span>
                </div>
              </div>
              {survey.summary && (
                <div className="admin-card-summary">
                  <div className="summary-item">
                    <span>Total de respuestas</span>
                    <strong>{survey.summary.totalResponses}</strong>
                  </div>
                  {survey.type === "yesno" ? (
                    <>
                      <div className="summary-item">
                        <span>Sí</span>
                        <strong>{survey.summary.yesCount ?? 0}</strong>
                      </div>
                      <div className="summary-item">
                        <span>No</span>
                        <strong>{survey.summary.noCount ?? 0}</strong>
                      </div>
                    </>
                  ) : (
                    <div className="summary-item">
                      <span>Promedio</span>
                      <strong>
                        {survey.summary.average?.toFixed(1) ?? "0.0"}
                      </strong>
                    </div>
                  )}
                </div>
              )}
              {survey.summary && survey.summary.totalResponses > 0 && (
                <div className="poll-chart">
                  <h4>Distribución de respuestas</h4>
                  {survey.type === "yesno" ? (
                    <>
                      {[
                        {
                          label: "Sí",
                          value: survey.summary.yesCount ?? 0,
                          tone: "yes",
                        },
                        {
                          label: "No",
                          value: survey.summary.noCount ?? 0,
                          tone: "no",
                        },
                      ].map((item) => {
                        const percentage =
                          survey.summary && survey.summary.totalResponses > 0
                            ? Math.round(
                                (item.value / survey.summary.totalResponses) *
                                  100,
                              )
                            : 0;

                        return (
                          <div key={item.label} className="chart-row">
                            <div className="chart-row-label">
                              <span>{item.label}</span>
                              <strong>
                                {item.value} ({percentage}%)
                              </strong>
                            </div>
                            <div className="chart-track">
                              <div
                                className={`chart-fill ${item.tone}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      {[1, 2, 3, 4, 5].map((score) => {
                        const scoreKey = String(score);
                        const value =
                          survey.summary?.ratingCounts?.[scoreKey] ?? 0;
                        const percentage =
                          survey.summary && survey.summary.totalResponses > 0
                            ? Math.round(
                                (value / survey.summary.totalResponses) * 100,
                              )
                            : 0;

                        return (
                          <div key={score} className="chart-row">
                            <div className="chart-row-label">
                              <span>
                                {score} estrella{score > 1 ? "s" : ""}
                              </span>
                              <strong>
                                {value} ({percentage}%)
                              </strong>
                            </div>
                            <div className="chart-track">
                              <div
                                className="chart-fill rating"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
              <div className="admin-actions">
                <button type="button" onClick={() => editSurvey(survey)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => deleteSurvey(survey.id)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="pagination">
        <button
          type="button"
          disabled={adminPage <= 1}
          onClick={() => setAdminPage(adminPage - 1)}
        >
          Anterior
        </button>
        <span>
          Página {adminPage} de {totalPages}
        </span>
        <button
          type="button"
          disabled={adminPage >= totalPages}
          onClick={() => setAdminPage(adminPage + 1)}
        >
          Siguiente
        </button>
      </div>
      {renderModal()}
    </section>
  );

  const renderGreenSpaceModal = () => {
    if (!showGreenSpaceModal || user?.role !== "admin") return null;

    return (
      <AppModal
        isOpen={showGreenSpaceModal}
        onClose={closeGreenSpaceModal}
        title={editingGreenSpace ? "Editar area verde" : "Registrar area verde"}
        description={
          editingGreenSpace
            ? "Actualiza la informacion del espacio verde."
            : "Completa la informacion para registrar un nuevo espacio verde."
        }
      >
        <form className="admin-form" onSubmit={saveGreenSpace}>
          <div className="field-row">
            <label>
              Nombre
              <input
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                placeholder="Ej: Jardin Central"
                required
              />
            </label>
            <label>
              Ubicacion
              <input
                value={spaceLocation}
                onChange={(e) => setSpaceLocation(e.target.value)}
                placeholder="Ej: Frente a biblioteca"
                required
              />
            </label>
          </div>
          <div className="field-row">
            <label>
              Area total (m2)
              <input
                type="number"
                min="0"
                value={spaceArea}
                onChange={(e) => setSpaceArea(e.target.value)}
                placeholder="0"
                required
              />
            </label>
            <label>
              Numero de arboles altos
              <input
                type="number"
                min="0"
                value={spaceTrees}
                onChange={(e) => setSpaceTrees(e.target.value)}
                placeholder="0"
                required
              />
            </label>
          </div>

          <p className="muted">
            Las imagenes se agregan solo desde tu equipo con el boton "Elegir
            archivos".
          </p>
          {spaceImagePreviewList.length > 0 && (
            <div className="green-space-preview-list">
              {spaceImagePreviewList.map((image, index) => (
                <figure
                  key={`${image}-${index}`}
                  className="green-space-preview-item"
                >
                  <img
                    src={resolveAssetUrl(image)}
                    alt={`Previsualizacion ${index + 1}`}
                  />
                  <figcaption>{image}</figcaption>
                </figure>
              ))}
            </div>
          )}

          <label>
            Imagenes del area verde (solo carga local)
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={uploadGreenSpaceImages}
              disabled={uploadingSpaceImages}
            />
          </label>
          {spaceImagePreviewList.length === 0 && (
            <p className="muted">Aun no se han subido imagenes.</p>
          )}
          {uploadingSpaceImages && (
            <p className="muted">Subiendo imagenes, por favor espera...</p>
          )}

          <div className="button-row user-modal-actions">
            <button type="submit">
              {editingGreenSpace ? "Guardar cambios" : "Registrar"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={closeGreenSpaceModal}
            >
              Cancelar
            </button>
            {editingGreenSpace && (
              <button
                type="button"
                className="danger"
                onClick={() => {
                  deleteGreenSpace(editingGreenSpace.id);
                  closeGreenSpaceModal();
                }}
              >
                Eliminar
              </button>
            )}
          </div>
        </form>
      </AppModal>
    );
  };

  const renderGreenSpaceDetailsModal = () => {
    if (!showGreenSpaceDetailsModal) return null;

    const space = greenSpaces.find((entry) => entry.id === greenSpaceDetailsId);
    if (!space) return null;

    return (
      <AppModal
        isOpen={showGreenSpaceDetailsModal}
        onClose={closeGreenSpaceDetailsModal}
        title="Detalle de area verde"
        description={space.name}
      >
        <div className="admin-form">
          <div className="field-row">
            <label>
              Nombre
              <input value={space.name} readOnly disabled />
            </label>
            <label>
              Ubicacion
              <input value={space.location} readOnly disabled />
            </label>
          </div>
          <div className="field-row">
            <label>
              Area total
              <input value={`${space.totalAreaM2} m2`} readOnly disabled />
            </label>
            <label>
              Arboles altos
              <input value={String(space.tallTreeCount)} readOnly disabled />
            </label>
          </div>
          <div className="button-row">
            <button
              type="button"
              className="secondary"
              onClick={closeGreenSpaceDetailsModal}
            >
              Cerrar
            </button>
          </div>
        </div>
      </AppModal>
    );
  };

  const renderProposalCreateModal = () => {
    if (!showProposalModal) return null;

    return (
      <AppModal
        isOpen={showProposalModal}
        onClose={closeCreateProposalModal}
        title="Nueva propuesta"
        description="Registra una propuesta de mejora para un area verde."
      >
        <form className="admin-form" onSubmit={submitProposal}>
          <div className="field-row">
            <label>
              Titulo
              <input
                value={proposalTitleInput}
                onChange={(e) => setProposalTitleInput(e.target.value)}
                placeholder="Ej: Reforestacion del sendero norte"
                required
              />
            </label>
            <label>
              Area verde
              <select
                value={String(proposalSpaceIdInput)}
                onChange={(e) =>
                  setProposalSpaceIdInput(Number(e.target.value))
                }
                required
              >
                {greenSpaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Descripcion
            <textarea
              value={proposalDescriptionInput}
              onChange={(e) => setProposalDescriptionInput(e.target.value)}
              placeholder="Describe el problema y la mejora propuesta"
              required
            />
          </label>
          <div className="button-row">
            <button
              type="submit"
              disabled={isSubmittingProposal || greenSpaces.length === 0}
            >
              {isSubmittingProposal ? "Enviando..." : "Guardar propuesta"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={closeCreateProposalModal}
            >
              Cancelar
            </button>
          </div>
        </form>
      </AppModal>
    );
  };

  const renderProposalDetailsModal = () => {
    if (!showProposalDetailsModal) return null;

    const proposal = proposals.find((entry) => entry.id === proposalDetailsId);
    if (!proposal) return null;

    return (
      <AppModal
        isOpen={showProposalDetailsModal}
        onClose={closeProposalDetailsModal}
        title="Detalle de propuesta"
        description={proposal.title}
      >
        <div className="admin-form">
          <label>
            Descripcion
            <textarea value={proposal.description} readOnly disabled />
          </label>
          <div className="field-row">
            <label>
              Estado
              <input value={proposal.status} readOnly disabled />
            </label>
            <label>
              Votos
              <input value={String(proposal.totalVotes)} readOnly disabled />
            </label>
          </div>
          <div className="button-row">
            <button
              type="button"
              className="secondary"
              onClick={closeProposalDetailsModal}
            >
              Cerrar
            </button>
          </div>
        </div>
      </AppModal>
    );
  };

  const renderProposalManageModal = () => {
    if (!showProposalManageModal) return null;

    const proposal = proposals.find((entry) => entry.id === proposalManageId);
    if (!proposal) return null;

    return (
      <AppModal
        isOpen={showProposalManageModal}
        onClose={closeProposalManageModal}
        title="Editar propuesta"
        description={proposal.title}
      >
        <div className="admin-form">
          <label>
            Descripcion
            <textarea value={proposal.description} readOnly disabled />
          </label>

          <div className="field-row">
            <label>
              Inicio de votacion
              <input
                type="datetime-local"
                value={proposalWindows[proposal.id]?.start || ""}
                onChange={(e) =>
                  setProposalWindows((prev) => ({
                    ...prev,
                    [proposal.id]: {
                      start: e.target.value,
                      end: prev[proposal.id]?.end || "",
                    },
                  }))
                }
              />
            </label>
            <label>
              Fin de votacion
              <input
                type="datetime-local"
                value={proposalWindows[proposal.id]?.end || ""}
                onChange={(e) =>
                  setProposalWindows((prev) => ({
                    ...prev,
                    [proposal.id]: {
                      start: prev[proposal.id]?.start || "",
                      end: e.target.value,
                    },
                  }))
                }
              />
            </label>
          </div>

          <div className="button-row">
            <button
              type="button"
              onClick={async () => {
                await decideProposal(proposal.id, "accepted");
                closeProposalManageModal();
              }}
            >
              Guardar y abrir votacion
            </button>
            <button
              type="button"
              className="danger"
              onClick={async () => {
                await decideProposal(proposal.id, "rejected");
                closeProposalManageModal();
              }}
            >
              Rechazar propuesta
            </button>
            <button
              type="button"
              className="secondary"
              onClick={closeProposalManageModal}
            >
              Cancelar
            </button>
          </div>
        </div>
      </AppModal>
    );
  };

  const renderGreenSpacesSection = () => (
    <section className="box admin-box">
      <div className="admin-header">
        <div>
          <h2>Administracion de areas verdes</h2>
          <p>Gestiona los espacios verdes del campus.</p>
        </div>
      </div>

      <article className="principal-panel">
        <h3>Areas verdes del campus</h3>
        <DefaultTable
          rows={greenSpaces}
          columns={[
            {
              key: "name",
              label: "Nombre",
              sortable: true,
              sortValue: (space: GreenSpace) => space.name,
              render: (space: GreenSpace) => space.name,
            },
            {
              key: "location",
              label: "Ubicacion",
              sortable: true,
              sortValue: (space: GreenSpace) => space.location,
              render: (space: GreenSpace) => space.location,
            },
            {
              key: "area",
              label: "Area",
              sortable: true,
              sortValue: (space: GreenSpace) => space.totalAreaM2,
              render: (space: GreenSpace) => `${space.totalAreaM2} m2`,
            },
            {
              key: "trees",
              label: "Arboles",
              sortable: true,
              sortValue: (space: GreenSpace) => space.tallTreeCount,
              render: (space: GreenSpace) => space.tallTreeCount,
            },
            {
              key: "rating",
              label: "Valoracion",
              sortable: true,
              sortValue: (space: GreenSpace) =>
                Number(space.reviewSummary?.averageRating ?? 0),
              render: (space: GreenSpace) => (
                <div className="mini-rating-row">
                  {renderAverageStars(space.reviewSummary?.averageRating ?? 0)}
                  <span>
                    {(space.reviewSummary?.averageRating ?? 0).toFixed(1)}
                  </span>
                </div>
              ),
            },
            {
              key: "actions",
              label: "Acciones",
              render: (space: GreenSpace) => (
                <div className="table-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => openGreenSpaceDetailsModal(space)}
                  >
                    Ver detalle
                  </button>
                  {user?.role === "admin" && (
                    <button type="button" onClick={() => editGreenSpace(space)}>
                      Editar
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          getRowId={(space) => space.id}
          getSearchText={(space) =>
            `${space.name} ${space.location} ${space.totalAreaM2} ${space.tallTreeCount}`
          }
          emptyMessage="No hay areas verdes registradas."
          searchPlaceholder="Buscar por nombre o ubicacion"
          onAdd={user?.role === "admin" ? openCreateGreenSpaceModal : undefined}
          addButtonLabel="Nueva area verde"
        />
      </article>
      {renderGreenSpaceModal()}
      {renderGreenSpaceDetailsModal()}
    </section>
  );

  const renderGreenSpaceDetailSection = () => {
    if (!selectedGreenSpace) {
      return (
        <section className="box">
          <p>El area verde solicitada no existe.</p>
          <button type="button" onClick={() => navigate("/green-spaces")}>
            Volver a areas verdes
          </button>
        </section>
      );
    }

    const current = reviewDrafts[selectedGreenSpace.id]?.rating ?? 0;
    const greenSpaceImages = selectedGreenSpace.images || [];
    const activeImageIndex =
      activeGreenSpaceImageIndex[selectedGreenSpace.id] ?? 0;
    const activeImage =
      greenSpaceImages[activeImageIndex] || greenSpaceImages[0];

    const goToImage = (direction: number) => {
      if (greenSpaceImages.length <= 1) return;
      const nextIndex =
        (activeImageIndex + direction + greenSpaceImages.length) %
        greenSpaceImages.length;
      setActiveGreenSpaceImageIndex((prev) => ({
        ...prev,
        [selectedGreenSpace.id]: nextIndex,
      }));
    };

    return (
      <section className="box green-spaces-box">
        <div className="button-row">
          <button
            type="button"
            className="secondary"
            onClick={() => navigate("/green-spaces")}
          >
            Volver a lista
          </button>
          {user?.role === "admin" && (
            <>
              <button
                type="button"
                onClick={() => {
                  editGreenSpace(selectedGreenSpace);
                  navigate("/green-spaces");
                }}
              >
                Editar
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  deleteGreenSpace(selectedGreenSpace.id);
                  navigate("/green-spaces");
                }}
              >
                Eliminar
              </button>
            </>
          )}
        </div>

        <article className="green-space-card">
          <div className="green-space-header">
            <div>
              <h3>{selectedGreenSpace.name}</h3>
              <p>{selectedGreenSpace.location}</p>
            </div>
            <span className="poll-updated">
              {formatUpdatedAt(selectedGreenSpace.updatedAt)}
            </span>
          </div>
          <div className="green-space-metrics">
            <div className="summary-item">
              <span>Area total</span>
              <strong>{selectedGreenSpace.totalAreaM2} m2</strong>
            </div>
            <div className="summary-item">
              <span>Arboles altos</span>
              <strong>{selectedGreenSpace.tallTreeCount}</strong>
            </div>
            <div className="summary-item">
              <span>Calificacion promedio</span>
              <div className="detail-rating-row">
                {renderAverageStars(
                  selectedGreenSpace.reviewSummary?.averageRating ?? 0,
                )}
                <strong>
                  {(
                    selectedGreenSpace.reviewSummary?.averageRating ?? 0
                  ).toFixed(1)}{" "}
                  / 5
                </strong>
              </div>
            </div>
            <div className="summary-item">
              <span>Total de resenas</span>
              <strong>
                {selectedGreenSpace.reviewSummary?.totalReviews ?? 0}
              </strong>
            </div>
          </div>

          {activeImage && (
            <div className="green-space-carousel">
              <div className="green-space-carousel-main">
                <img
                  src={resolveAssetUrl(activeImage)}
                  alt={`${selectedGreenSpace.name} imagen ${activeImageIndex + 1}`}
                />
                {greenSpaceImages.length > 1 && (
                  <div className="green-space-carousel-controls">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => goToImage(-1)}
                    >
                      ‹
                    </button>
                    <span>
                      {activeImageIndex + 1} / {greenSpaceImages.length}
                    </span>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => goToImage(1)}
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>

              {greenSpaceImages.length > 1 && (
                <div className="green-space-carousel-thumbnails">
                  {greenSpaceImages.map((image, index) => (
                    <button
                      key={`${selectedGreenSpace.id}-thumb-${index}`}
                      type="button"
                      className={`green-space-carousel-thumb ${index === activeImageIndex ? "selected" : ""}`}
                      onClick={() =>
                        setActiveGreenSpaceImageIndex((prev) => ({
                          ...prev,
                          [selectedGreenSpace.id]: index,
                        }))
                      }
                    >
                      <img
                        src={resolveAssetUrl(image)}
                        alt={`${selectedGreenSpace.name} thumbnail ${index + 1}`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="green-space-review-box">
            <h4>Califica este espacio (0 a 5 estrellas)</h4>
            <div
              className="star-strip"
              role="radiogroup"
              aria-label="Calificacion de estrellas"
            >
              {[1, 2, 3, 4, 5].map((value) => {
                const filled = value <= current;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`star-button ${filled ? "filled" : ""}`}
                    aria-label={`${value} estrellas`}
                    onClick={() =>
                      updateGreenSpaceReviewDraft(selectedGreenSpace.id, {
                        rating: current === value ? 0 : value,
                      })
                    }
                  >
                    ★
                  </button>
                );
              })}
            </div>
            <p className="muted">
              Seleccion actual: {current} estrella{current === 1 ? "" : "s"}
            </p>
            <label>
              Comentarios y sugerencias
              <textarea
                value={reviewDrafts[selectedGreenSpace.id]?.comment ?? ""}
                onChange={(e) =>
                  updateGreenSpaceReviewDraft(selectedGreenSpace.id, {
                    comment: e.target.value,
                  })
                }
                placeholder="Escribe tu opinion o sugerencia para mejorar este espacio verde"
              />
            </label>
            <div className="button-row">
              <button
                type="button"
                onClick={() => submitGreenSpaceReview(selectedGreenSpace.id)}
              >
                Guardar resena
              </button>
            </div>
            {(selectedGreenSpace.recentReviews || []).length > 0 && (
              <div className="recent-reviews">
                <h5>Ultimas opiniones</h5>
                {(selectedGreenSpace.recentReviews || []).map(
                  (review, index) => (
                    <article
                      key={`${selectedGreenSpace.id}-review-${index}`}
                      className="recent-review-item"
                    >
                      <strong>
                        {review.username} · {review.rating}/5
                      </strong>
                      <p>{review.comment}</p>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>
        </article>
      </section>
    );
  };

  const renderAdminUsersSection = () => {
    const userColumns: DefaultTableColumn<AdminUser>[] = [
      {
        key: "name",
        label: "Nombre",
        sortable: true,
        sortValue: (entry) => entry.name,
        render: (entry) => entry.name,
      },
      {
        key: "username",
        label: "Usuario",
        sortable: true,
        sortValue: (entry) => entry.username,
        render: (entry) => `@${entry.username}`,
      },
      {
        key: "email",
        label: "Correo",
        sortable: true,
        sortValue: (entry) => entry.email,
        render: (entry) => entry.email,
      },
      {
        key: "roleName",
        label: "Rol",
        sortable: true,
        sortValue: (entry) => entry.roleName,
        render: (entry) => entry.roleName,
      },
      {
        key: "status",
        label: "Estado",
        sortable: true,
        sortValue: (entry) => (entry.isActive ? 1 : 0),
        render: (entry) => (
          <span className={`pill ${entry.isActive ? "active" : "inactive"}`}>
            {entry.isActive ? "Activo" : "Inactivo"}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Acciones",
        render: (entry) => (
          <div className="table-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => openUserDetailsModal(entry)}
            >
              Ver detalle
            </button>
            {entry.username !== "admin" && (
              <button type="button" onClick={() => openEditUserModal(entry)}>
                Editar
              </button>
            )}
          </div>
        ),
      },
    ];

    return (
      <section className="box admin-box">
        <div className="admin-header">
          <div>
            <h2>Administracion de usuarios</h2>
            <p>Gestiona todas las cuentas de usuario del sistema.</p>
          </div>
        </div>

        <article className="principal-panel">
          <h3>Usuarios del sistema</h3>
          <DefaultTable
            columns={userColumns}
            rows={adminUsers}
            getRowId={(entry) => entry.id}
            getSearchText={(entry) =>
              `${entry.name} ${entry.username} ${entry.email} ${entry.roleName}`
            }
            emptyMessage="No hay usuarios registrados."
            searchPlaceholder="Buscar por nombre, usuario o correo"
            onAdd={openCreateUserModal}
            addButtonLabel="Nuevo usuario"
          />
        </article>
        {renderUserModal()}
        {renderUserDetailsModal()}
      </section>
    );
  };

  const renderProposalsSection = () => {
    const statusLabel: Record<Proposal["status"], string> = {
      draft: "Pendiente de validacion",
      open: "Votacion abierta",
      closed: "Cerrada sin aprobacion",
      approved: "Aprobada por votacion",
      rejected: "Rechazada por administracion",
    };

    const getSpaceName = (spaceId: number) => {
      const target = greenSpaces.find((space) => space.id === spaceId);
      return target?.name || `Area #${spaceId}`;
    };

    const filteredProposals = proposals.filter((proposal) => {
      if (proposalStatusFilter === "all") return true;
      return proposal.status === proposalStatusFilter;
    });

    const proposalColumns: DefaultTableColumn<Proposal>[] = [
      {
        key: "title",
        label: "Titulo",
        sortable: true,
        sortValue: (proposal) => proposal.title,
        render: (proposal) => proposal.title,
      },
      {
        key: "space",
        label: "Area",
        sortable: true,
        sortValue: (proposal) => getSpaceName(proposal.spaceId),
        render: (proposal) => getSpaceName(proposal.spaceId),
      },
      {
        key: "status",
        label: "Estado",
        sortable: true,
        sortValue: (proposal) => proposal.status,
        render: (proposal) => (
          <span className={`pill proposal-status ${proposal.status}`}>
            {statusLabel[proposal.status]}
          </span>
        ),
      },
      {
        key: "votes",
        label: "Votos",
        sortable: true,
        sortValue: (proposal) => proposal.totalVotes,
        render: (proposal) => proposal.totalVotes,
      },
      {
        key: "updatedAt",
        label: "Actualizada",
        sortable: true,
        sortValue: (proposal) => proposal.updatedAt || "",
        render: (proposal) => formatUpdatedAt(proposal.updatedAt || undefined),
      },
      {
        key: "actions",
        label: "Acciones",
        render: (proposal) => {
          const canVote =
            user?.role === "regular" && proposal.status === "open";
          const canManageDraft =
            user?.role === "admin" && proposal.status === "draft";
          const canFinalize =
            user?.role === "admin" && proposal.status === "open";

          return (
            <div className="table-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => openProposalDetailsModal(proposal)}
              >
                Ver detalle
              </button>
              {canManageDraft && (
                <button
                  type="button"
                  onClick={() => openProposalManageModal(proposal)}
                >
                  Editar
                </button>
              )}
              {canVote && (
                <button
                  type="button"
                  onClick={() => voteProposal(proposal.id)}
                  disabled={proposalActionLoadingId === proposal.id}
                >
                  Votar
                </button>
              )}
              {canFinalize && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => finalizeProposal(proposal.id)}
                  disabled={proposalActionLoadingId === proposal.id}
                >
                  Finalizar
                </button>
              )}
            </div>
          );
        },
      },
    ];

    return (
      <section className="box admin-box">
        <div className="admin-header">
          <div>
            <h2>Propuestas de mejora</h2>
            <p>
              Los usuarios registran propuestas para areas verdes y se aprueban
              mediante votacion.
            </p>
          </div>
        </div>

        <article className="principal-panel">
          <h3>Listado de propuestas</h3>
          <div className="proposal-filter-row">
            <button
              type="button"
              className={
                proposalStatusFilter === "all" ? "secondary" : undefined
              }
              onClick={() => setProposalStatusFilter("all")}
            >
              Todas
            </button>
            <button
              type="button"
              className={
                proposalStatusFilter === "open" ? "secondary" : undefined
              }
              onClick={() => setProposalStatusFilter("open")}
            >
              Votacion abierta
            </button>
            <button
              type="button"
              className={
                proposalStatusFilter === "draft" ? "secondary" : undefined
              }
              onClick={() => setProposalStatusFilter("draft")}
            >
              Pendientes
            </button>
            <button
              type="button"
              className={
                proposalStatusFilter === "approved" ? "secondary" : undefined
              }
              onClick={() => setProposalStatusFilter("approved")}
            >
              Aprobadas
            </button>
          </div>
          <DefaultTable
            rows={filteredProposals}
            columns={proposalColumns}
            getRowId={(proposal) => proposal.id}
            getSearchText={(proposal) =>
              `${proposal.title} ${proposal.description} ${proposal.status} ${getSpaceName(proposal.spaceId)}`
            }
            emptyMessage="No hay propuestas visibles por el momento."
            searchPlaceholder="Buscar por titulo, descripcion o estado"
            onAdd={openCreateProposalModal}
            addButtonLabel="Nueva propuesta"
          />
        </article>
        {renderProposalCreateModal()}
        {renderProposalDetailsModal()}
        {renderProposalManageModal()}
      </section>
    );
  };

  const renderPrincipalSection = () => {
    const surveySource = user?.role === "admin" ? adminSurveyOverview : surveys;
    const totalPolls = surveySource.length;
    const activePolls = surveySource.filter((survey) => survey.active).length;
    const totalResponses = surveySource.reduce(
      (acc, survey) => acc + (survey.summary?.totalResponses ?? 0),
      0,
    );
    const totalGreenArea = greenSpaces.reduce(
      (acc, space) => acc + (space.totalAreaM2 || 0),
      0,
    );
    const totalTallTrees = greenSpaces.reduce(
      (acc, space) => acc + (space.tallTreeCount || 0),
      0,
    );
    const openProposals = proposals.filter(
      (proposal) => proposal.status === "open",
    ).length;
    const approvedProposals = proposals.filter(
      (proposal) => proposal.status === "approved",
    ).length;
    const pendingProposals = proposals.filter(
      (proposal) => proposal.status === "draft",
    ).length;

    return (
      <section className="box principal-box">
        <div className="principal-summary-grid">
          <article className="summary-item">
            <span>Encuestas totales</span>
            <strong>{totalPolls}</strong>
          </article>
          <article className="summary-item">
            <span>Encuestas visibles</span>
            <strong>{activePolls}</strong>
          </article>
          <article className="summary-item">
            <span>Respuestas registradas</span>
            <strong>{totalResponses}</strong>
          </article>
          <article className="summary-item">
            <span>Areas verdes</span>
            <strong>{greenSpaces.length}</strong>
          </article>
          <article className="summary-item">
            <span>Superficie verde total</span>
            <strong>{totalGreenArea.toFixed(0)} m2</strong>
          </article>
          <article className="summary-item">
            <span>Arboles altos</span>
            <strong>{totalTallTrees}</strong>
          </article>
          <article className="summary-item">
            <span>Propuestas visibles</span>
            <strong>{proposals.length}</strong>
          </article>
        </div>

        <div className="principal-highlights">
          <article className="principal-panel">
            <h3>Encuestas recientes</h3>
            {surveySource.slice(0, 4).map((survey) => (
              <p key={survey.id}>
                <strong>{survey.title}</strong> ·{" "}
                {survey.summary?.totalResponses ?? 0} respuestas
              </p>
            ))}
            {surveySource.length === 0 && <p>No hay encuestas disponibles.</p>}
          </article>
          <article className="principal-panel">
            <h3>Areas verdes destacadas</h3>
            {greenSpaces.slice(0, 4).map((space) => (
              <p key={space.id}>
                <strong>{space.name}</strong> · {space.totalAreaM2} m2 ·{" "}
                {space.tallTreeCount} arboles
              </p>
            ))}
            {greenSpaces.length === 0 && (
              <p>No hay areas verdes registradas.</p>
            )}
          </article>
          <article className="principal-panel">
            <h3>Estado de propuestas</h3>
            <button
              type="button"
              className="summary-link-button"
              onClick={() => openProposalsWithFilter("open")}
            >
              <strong>{openProposals}</strong> en votacion abierta
            </button>
            <button
              type="button"
              className="summary-link-button"
              onClick={() => openProposalsWithFilter("approved")}
            >
              <strong>{approvedProposals}</strong> aprobadas por votacion
            </button>
            {user?.role === "admin" && (
              <button
                type="button"
                className="summary-link-button"
                onClick={() => openProposalsWithFilter("draft")}
              >
                <strong>{pendingProposals}</strong> pendientes de validacion
              </button>
            )}
            {proposals.length === 0 && <p>No hay propuestas disponibles.</p>}
          </article>
        </div>
      </section>
    );
  };

  const renderMainSection = () => {
    if (route === "/") {
      return renderPrincipalSection();
    }

    if (route === "/profile") {
      return renderProfileSection();
    }

    if (route.startsWith("/green-spaces/")) {
      return renderGreenSpaceDetailSection();
    }

    if (route === "/green-spaces") {
      return renderGreenSpacesSection();
    }

    if (route === "/proposals") {
      return renderProposalsSection();
    }

    if (route === "/admin-users" && user?.role === "admin") {
      return renderAdminUsersSection();
    }

    if (route === "/surveys" && user?.role === "admin") {
      return renderAdminPanel();
    }

    return (
      <section className="box">
        <div className="filter-row user-filter-row">
          <div className="filter-group">
            <label>
              Mostrar:
              <select
                value={answerFilter}
                onChange={(e) => {
                  setAnswerFilter(
                    e.target.value as "all" | "answered" | "unanswered",
                  );
                  setUserPage(1);
                }}
              >
                <option value="all">Todas las encuestas</option>
                <option value="answered">Respondidas</option>
                <option value="unanswered">Sin responder</option>
              </select>
            </label>
          </div>
          <div className="filter-group filter-summary-group">
            <span className="nav-badge">
              {filteredSurveys.length} encuestas
            </span>
            {answerFilter !== "all" && (
              <button
                type="button"
                className="reset-filter-button"
                onClick={() => {
                  setAnswerFilter("all");
                  setUserPage(1);
                }}
              >
                Ver todas
              </button>
            )}
          </div>
        </div>
        {filteredSurveys.length === 0 ? (
          <p>No hay encuestas disponibles.</p>
        ) : (
          pagedSurveys.map((survey) => {
            const previousAnswer = pollAnswers[survey.id];
            const hasAnswered = Boolean(previousAnswer);

            return (
              <article key={survey.id} className="survey-card">
                <div className="survey-card-header">
                  <div>
                    <h2>{survey.title}</h2>
                    <p>{survey.description}</p>
                  </div>
                  <div className="survey-card-meta">
                    <span
                      className={`pill ${survey.active ? "active" : "inactive"}`}
                    >
                      {survey.active ? "Activa" : "Inactiva"}
                    </span>
                    <span className="poll-updated">
                      {formatUpdatedAt(survey.updatedAt)}
                    </span>
                  </div>
                </div>
                {hasAnswered && activePollId !== survey.id && (
                  <div className="survey-card-answer">
                    <span className="pill answered">Respondida</span>
                    <p className="previous-answer">
                      Tu respuesta: {previousAnswer}
                    </p>
                  </div>
                )}
                <div className="poll-actions">
                  {activePollId === survey.id ? (
                    <div className="poll-form">
                      {survey.type === "yesno" ? (
                        <div className="radio-group">
                          <label>
                            <input
                              type="radio"
                              name={`poll-${survey.id}`}
                              value="yes"
                              checked={voteValue === "yes"}
                              onChange={() => setVoteValue("yes")}
                            />
                            Sí
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`poll-${survey.id}`}
                              value="no"
                              checked={voteValue === "no"}
                              onChange={() => setVoteValue("no")}
                            />
                            No
                          </label>
                        </div>
                      ) : (
                        <label>
                          Califica de 1 a 5
                          <select
                            value={voteValue}
                            onChange={(e) => setVoteValue(e.target.value)}
                          >
                            {[1, 2, 3, 4, 5].map((value) => (
                              <option key={value} value={String(value)}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      <div className="button-row">
                        <button
                          type="button"
                          onClick={() => submitResponse(survey)}
                        >
                          Enviar voto
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setActivePollId(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePollId(survey.id);
                        setVoteValue(
                          survey.type === "yesno"
                            ? previousAnswer || "yes"
                            : previousAnswer || "3",
                        );
                      }}
                    >
                      {hasAnswered ? "Volver a votar" : "Responder"}
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
        {filteredSurveys.length > 0 && (
          <div className="pagination">
            <button
              type="button"
              disabled={userPage <= 1}
              onClick={() => setUserPage(userPage - 1)}
            >
              Anterior
            </button>
            <span>
              Página {safeUserPage} de {userTotalPages}
            </span>
            <button
              type="button"
              disabled={userPage >= userTotalPages}
              onClick={() => setUserPage(userPage + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </section>
    );
  };

  const closeToast = () => {
    setSuccessMessage(null);
    setSuccessVisible(false);
  };

  const renderToast = () => {
    if (!successMessage) return null;

    return (
      <div className="toast-container">
        <div className={`toast-message${successVisible ? " visible" : ""}`}>
          <p onClick={closeToast}>{successMessage}</p>
          <button type="button" className="toast-close" onClick={closeToast}>
            ×
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app-shell">
      {renderToast()}
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setSidebarOpen((open) => !open)}
        aria-expanded={sidebarOpen}
      >
        ☰
      </button>
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="brand">
          <div>
            <h2>Panel del campus</h2>
            <p>Accede a areas verdes y tu perfil.</p>
          </div>
        </div>
        {user?.role !== "admin" && (
          <>
            <div className="activity-badge">
              {answeredPolls} encuestas respondidas
            </div>
            <div className="activity-badge secondary">
              {unansweredPolls} encuestas sin responder
            </div>
          </>
        )}
        <nav className="nav-bar">
          <button
            type="button"
            className={route === "/" ? "active" : ""}
            onClick={() => navigate("/")}
          >
            Principal
          </button>
          <button
            type="button"
            className={route === "/profile" ? "active" : ""}
            onClick={() => navigate("/profile")}
          >
            Perfil
          </button>
          <button
            type="button"
            className={isGreenSpacesRoute ? "active" : ""}
            onClick={() => navigate("/green-spaces")}
          >
            Areas verdes
          </button>
          <button
            type="button"
            className={route === "/proposals" ? "active" : ""}
            onClick={() => openProposalsWithFilter("all")}
          >
            Propuestas
          </button>
          {user?.role === "admin" && (
            <>
              <button
                type="button"
                className={route === "/admin-users" ? "active" : ""}
                onClick={() => navigate("/admin-users")}
              >
                Usuarios
              </button>
            </>
          )}
        </nav>
        {user?.role === "admin" && <span className="nav-badge">ADMIN</span>}
        <div className="sidebar-user-panel">
          <div className="avatar">
            {(() => {
              return (
                <img
                  src={resolveAvatarUrl(user?.avatarUrl)}
                  alt={`${displayName} avatar`}
                />
              );
            })()}
          </div>
          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="logout-button sidebar-logout" onClick={logout}>
          Cerrar sesión
        </button>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>
        </header>
        {renderMainSection()}
        {renderPasswordModal()}
      </main>
    </div>
  );
}

export default App;
