import { FormEvent, useEffect, useRef, useState } from "react";
import { AppModal } from "./components/AppModal";
import { LoginView } from "./components/auth/LoginView";
import { RegisterView } from "./components/auth/RegisterView";
import { DefaultTable, DefaultTableColumn } from "./components/DefaultTable";
import { ImageCarousel } from "./components/ImageCarousel";
import { GreenSpaceDetailsModal } from "./components/greenSpaces/GreenSpaceDetailsModal";
import { GreenSpaceFormModal } from "./components/greenSpaces/GreenSpaceFormModal";
import { GreenSpacesSection } from "./components/greenSpaces/GreenSpacesSection";
import { AppSidebar } from "./components/layout/AppSidebar";
import { ProfileForm } from "./components/profile/ProfileForm";
import { ProfilePage } from "./components/profile/ProfilePage";
import { ProjectActivityDetailSection } from "./components/projects/ProjectActivityDetailSection";
import { ProjectDetailSection } from "./components/projects/ProjectDetailSection";
import { ProjectsListSection } from "./components/projects/ProjectsListSection";
import { ProposalDetailSection } from "./components/proposals/ProposalDetailSection";
import { ProposalCreateModal } from "./components/proposals/ProposalCreateModal";
import { ProposalsListSection } from "./components/proposals/ProposalsListSection";
import { Report } from "./components/reports/Report";
import { Reports } from "./components/reports/Reports";
import { GreenMetricsSection } from "./components/greenMetrics/GreenMetricsSection";
import { AiChatWidget } from "./components/chatbot/AiChatWidget";
import { TreeTypeDetailSection } from "./components/treeTypes/TreeTypeDetailSection";
import { TreeTypesSection } from "./components/treeTypes/TreeTypesSection";
import { TreeDetailSection } from "./components/trees/TreeDetailSection";
import { TreesSection } from "./components/trees/TreesSection";
import { AdminUserFormModal } from "./components/users/AdminUserFormModal";
import { AdminUsersSection } from "./components/users/AdminUsersSection";
import { UserDetailsModal } from "./components/users/UserDetailsModal";
import { useProposalWorkflow } from "./features/proposals/useProposalWorkflow";
import { useGreenMetrics } from "./features/greenMetrics/useGreenMetrics";
import { useReports } from "./features/reports/useReports";
import {
  getPageHeaderMeta,
  getRouteFlags,
  getSelectedRouteIds,
} from "./features/navigation/routeMeta";
import { TreeInventoryItem } from "./features/trees/types";
import { useTrees } from "./features/trees/useTrees";
import { useTreeTypes } from "./features/treeTypes/useTreeTypes";

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
  const MOBILE_BREAKPOINT_PX = 1024;
  const isMobileViewport = () => window.innerWidth <= MOBILE_BREAKPOINT_PX;

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback;

  const parseJwtPayload = (jwtToken: string): { exp?: number } | null => {
    const segments = jwtToken.split(".");
    if (segments.length !== 3) return null;

    try {
      const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
      const paddedBase64 = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        "=",
      );
      const payload = JSON.parse(window.atob(paddedBase64));
      if (!payload || typeof payload !== "object") {
        return null;
      }

      return payload as { exp?: number };
    } catch {
      return null;
    }
  };

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
  const [authReady, setAuthReady] = useState(false);
  const [route, setRoute] = useState(
    `${window.location.pathname}${window.location.search}`,
  );
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
    } catch {
      setError("Error al subir la imagen");
    }
  };
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobileViewport());
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminPage, setAdminPage] = useState(1);
  const isHandlingUnauthorizedRef = useRef(false);
  const previousPathnameRef = useRef(window.location.pathname);

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
  const [treeTypeInventoryRows, setTreeTypeInventoryRows] = useState<
    TreeInventoryItem[]
  >([]);
  const [selectedTreeDetail, setSelectedTreeDetail] =
    useState<TreeInventoryItem | null>(null);
  const {
    reports,
    reportStateFilter,
    reportTitleInput,
    reportDescriptionInput,
    reportSpaceIdInput,
    isSubmittingReport,
    showReportCreateModal,
    showReportEditModal,
    editingReportStateInput,
    selectedReportId,
    selectedReport,
    setReportStateFilter,
    setReportTitleInput,
    setReportDescriptionInput,
    setReportSpaceIdInput,
    setEditingReportStateInput,
    openCreateReportModal,
    closeCreateReportModal,
    openEditReportModal,
    closeEditReportModal,
    saveReport,
    deleteReport,
    completeReport,
  } = useReports({
    token,
    route,
    greenSpaces,
    setError,
    setSuccessMessage,
  });
  const {
    records: greenMetricRecords,
    latestRecord: latestGreenMetricRecord,
    isSubmitting: isSubmittingGreenMetric,
    isLoading: isLoadingGreenMetrics,
    formInput: greenMetricFormInput,
    setFormValue: setGreenMetricFormValue,
    saveRecord,
  } = useGreenMetrics({
    token,
    route,
    userRole: user?.role,
    setError,
    setSuccessMessage,
  });
  const {
    treeTypes,
    treeTypeNameInput,
    treeTypeDescriptionInput,
    treeTypeImagesInput,
    editingTreeTypeId,
    isSubmittingTreeType,
    uploadingTreeTypeImages,
    setTreeTypeNameInput,
    setTreeTypeDescriptionInput,
    setTreeTypeImagesInput,
    resetTreeTypeForm,
    startEditTreeType,
    saveTreeType,
    deleteTreeType,
    uploadTreeTypeImages,
  } = useTreeTypes({
    token,
    route,
    userRole: user?.role,
    setError,
    setSuccessMessage,
  });
  const {
    trees,
    selectedSpaceFilterName,
    treeNameInput,
    treeHealthStatusInput,
    treeTypeIdInput,
    treeSpaceIdInput,
    treeImagesInput,
    editingTreeId,
    isSubmittingTree,
    uploadingTreeImages,
    treeActionLoadingId,
    setTreeNameInput,
    setTreeHealthStatusInput,
    setTreeTypeIdInput,
    setTreeSpaceIdInput,
    setTreeImagesInput,
    resetTreeForm,
    uploadTreeImages,
    startEditTree,
    saveTree,
    deleteTree,
    approveTree,
    rejectTree,
  } = useTrees({
    token,
    route,
    userRole: user?.role,
    treeTypes,
    greenSpaces,
    setError,
    setSuccessMessage,
  });
  const spaceImagePreviewList = spaceImagesInput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const navigate = (path: string, replace = false) => {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (currentPath !== path) {
      if (replace) {
        window.history.replaceState(null, "", path);
      } else {
        window.history.pushState(null, "", path);
      }
    }
    setRoute(path);

    if (isMobileViewport()) {
      setSidebarOpen(false);
    }
  };

  const {
    proposals,
    projectEntries,
    proposalTitleInput,
    proposalDescriptionInput,
    proposalSpaceIdInput,
    proposalActionLoadingId,
    proposalWindows,
    isSubmittingProposal,
    showProposalModal,
    proposalProjectDetails,
    proposalProjectLoadingId,
    projectUpdateTitleInput,
    projectUpdateDescriptionInput,
    projectUpdateImagesInput,
    projectStatusDrafts,
    uploadingProjectUpdateImages,
    isSubmittingProjectUpdate,
    isUpdatingProjectStatus,
    proposalStatusFilter,
    proposalProjectStatusByProposalId,
    selectedProposalId,
    selectedProjectId,
    selectedProjectEntry,
    setProposalTitleInput,
    setProposalDescriptionInput,
    setProposalSpaceIdInput,
    setProjectUpdateTitleInput,
    setProjectUpdateDescriptionInput,
    setProjectUpdateImagesInput,
    setProjectStatusDrafts,
    setProposalStatusFilter,
    fetchProposals,
    fetchProjects,
    fetchProposalProjectDetails,
    fetchProjectDetailsByProjectId,
    uploadProjectActivityImages,
    submitProjectActivityUpdate,
    updateProjectActivityUpdate,
    deleteProjectActivityUpdate,
    updateProjectCompletedStatus,
    openProposalsWithFilter,
    openProjects,
    openCreateProposalModal,
    closeCreateProposalModal,
    openProjectDetailPage,
    openProposalDetailPage,
    setProposalVotingStart,
    setProposalVotingEnd,
    setProposalMinimumVotesRequired,
    submitProposal,
    voteProposal,
    decideProposal,
    finalizeProposal,
    deleteProposal,
    resetProposalState,
  } = useProposalWorkflow({
    token,
    route,
    greenSpaces,
    setError,
    setSuccessMessage,
    getErrorMessage,
    navigate,
  });

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    const ignoredAuthEndpoints = ["/api/auth/login", "/api/auth/register"];

    const readRequestUrl = (input: RequestInfo | URL) => {
      if (typeof input === "string") return input;
      if (input instanceof URL) return input.toString();
      return input.url;
    };

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, init);

      if (
        response.status === 401 &&
        token &&
        !isHandlingUnauthorizedRef.current
      ) {
        const requestUrl = readRequestUrl(input);
        const shouldIgnore = ignoredAuthEndpoints.some((endpoint) =>
          requestUrl.includes(endpoint),
        );

        if (!shouldIgnore) {
          isHandlingUnauthorizedRef.current = true;
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
          setError("Tu sesión expiró. Inicia sesión nuevamente.");
          navigate("/login", true);
          window.setTimeout(() => {
            isHandlingUnauthorizedRef.current = false;
          }, 0);
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [token]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      const tokenPayload = parseJwtPayload(storedToken);
      const tokenIsExpired =
        typeof tokenPayload?.exp === "number" &&
        tokenPayload.exp * 1000 <= Date.now();

      if (!tokenPayload || tokenIsExpired) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } else {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          const storedAnswers = localStorage.getItem(
            `pollAnswers-${parsedUser.username}`,
          );
          if (storedAnswers) {
            setPollAnswers(JSON.parse(storedAnswers));
          }
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
    }

    setAuthReady(true);

    const handlePopState = () =>
      setRoute(`${window.location.pathname}${window.location.search}`);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (route === "/login" || route === "/register") {
      if (token) {
        navigate("/", true);
      }
      return;
    }

    if (
      !token &&
      (route === "/profile" || route === "/admin-users" || route === "/surveys")
    ) {
      navigate("/login", true);
    }
  }, [authReady, route, token]);

  useEffect(() => {
    const currentPathname = route.split("?")[0] || route;
    if (previousPathnameRef.current !== currentPathname) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    previousPathnameRef.current = currentPathname;

    if (isMobileViewport()) {
      setSidebarOpen(false);
    }
  }, [route]);

  useEffect(() => {
    const shouldLockBodyScroll = isMobileViewport() && sidebarOpen;
    document.body.classList.toggle("sidebar-mobile-open", shouldLockBodyScroll);

    return () => {
      document.body.classList.remove("sidebar-mobile-open");
    };
  }, [sidebarOpen]);

  useEffect(() => {
    // Survey module was removed from backend; keep only active modules loading.
    if (route === "/surveys") {
      navigate("/", true);
      return;
    }

    fetchGreenSpaces();
    fetchProposals();
    fetchProjects();

    if (token && user?.role === "admin" && route === "/admin-users") {
      fetchAdminRoles();
      fetchAdminUsers();
    }
  }, [token, route, user]);

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
        setError("No se pudieron cargar las áreas verdes");
        return;
      }
      const data = await res.json();
      setGreenSpaces(Array.isArray(data) ? data : []);
    } catch {
      setGreenSpaces([]);
      setError("No se pudieron cargar las áreas verdes");
    }
  };

  const fetchSurveys = async () => {
    try {
      const res = await fetch("/api/surveys?active=true&page=1&limit=1000");
      if (!res.ok) {
        setSurveys([]);
        setUserPage(1);
        setError("El módulo de encuestas aún no está disponible");
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
          "El módulo de encuestas de administrador aún no está disponible",
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
    resetProposalState();
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

  const isAuthenticated = Boolean(token);
  const isGuest = !isAuthenticated;

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

  const summarizeText = (value: string, maxLength = 120) => {
    const normalized = (value || "").trim();
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength).trimEnd()}...`;
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
  const {
    isGreenSpacesRoute,
    isProjectsRoute,
    isReportsRoute,
    isGreenMetricsRoute,
    isTreeTypesRoute,
    isTreesRoute,
  } = getRouteFlags(route);
  const { selectedGreenSpaceId, selectedTreeTypeId, selectedTreeId } =
    getSelectedRouteIds(route);
  const selectedProjectUpdateId = (() => {
    if (!route.startsWith("/projects/")) return null;
    const pathOnly = route.split("?")[0] || route;
    const segments = pathOnly.split("/");
    if (segments[3] !== "updates") return null;
    const id = Number(segments[4]);
    return Number.isFinite(id) ? id : null;
  })();
  const selectedGreenSpace = selectedGreenSpaceId
    ? greenSpaces.find((space) => space.id === selectedGreenSpaceId) || null
    : null;
  const selectedTreeType = selectedTreeTypeId
    ? treeTypes.find((entry) => entry.id === selectedTreeTypeId) || null
    : null;
  const selectedProjectEntryFromDetails = selectedProjectId
    ? Object.values(proposalProjectDetails).find(
        (details) => details.project?.id === selectedProjectId,
      )
    : undefined;
  const resolvedSelectedProjectEntry =
    selectedProjectEntry ||
    (selectedProjectEntryFromDetails?.project
      ? {
          proposal: selectedProjectEntryFromDetails.proposal,
          project: selectedProjectEntryFromDetails.project,
          latestUpdate: null,
        }
      : null);
  const { pageTitle, pageSubtitle } = getPageHeaderMeta(route, displayName);

  useEffect(() => {
    if (!route.startsWith("/projects/") || !selectedProjectId) {
      return;
    }

    if (!selectedProjectEntry) {
      const hasCachedDetails = Object.values(proposalProjectDetails).some(
        (details) => details.project?.id === selectedProjectId,
      );

      if (!hasCachedDetails) {
        fetchProjectDetailsByProjectId(selectedProjectId);
      }
      return;
    }

    const proposalId = selectedProjectEntry.proposal.id;
    const cachedDetails = proposalProjectDetails[proposalId];
    if (cachedDetails?.project?.id === selectedProjectEntry.project.id) {
      return;
    }

    fetchProposalProjectDetails(proposalId);
  }, [
    route,
    token,
    selectedProjectId,
    selectedProjectEntry,
    proposalProjectDetails,
  ]);

  useEffect(() => {
    if (!route.startsWith("/tree-types/")) {
      setTreeTypeInventoryRows([]);
      return;
    }

    if (!selectedTreeTypeId) {
      setTreeTypeInventoryRows([]);
      return;
    }

    const fetchTreeTypeInventory = async () => {
      try {
        const response = await fetch(
          `/api/trees?typeId=${selectedTreeTypeId}`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : undefined,
          },
        );

        if (!response.ok) {
          setTreeTypeInventoryRows([]);
          setError("No se pudo cargar el inventario de este tipo de árbol");
          return;
        }

        const data = await response.json();
        setTreeTypeInventoryRows(Array.isArray(data) ? data : []);
      } catch {
        setTreeTypeInventoryRows([]);
        setError("No se pudo cargar el inventario de este tipo de árbol");
      }
    };

    fetchTreeTypeInventory();
  }, [token, route, selectedTreeTypeId]);

  useEffect(() => {
    if (!route.startsWith("/trees/")) {
      setSelectedTreeDetail(null);
      return;
    }

    if (!selectedTreeId) {
      setSelectedTreeDetail(null);
      return;
    }

    const knownTree =
      trees.find((entry) => entry.id === selectedTreeId) || null;
    if (knownTree) {
      setSelectedTreeDetail(knownTree);
    }

    const fetchTreeDetail = async () => {
      try {
        const response = await fetch(`/api/trees/${selectedTreeId}`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        });

        if (!response.ok) {
          if (response.status === 404) {
            setSelectedTreeDetail(null);
            return;
          }

          setError("No se pudo cargar el detalle del árbol");
          return;
        }

        const data = await response.json();
        setSelectedTreeDetail(data as TreeInventoryItem);
      } catch {
        setError("No se pudo cargar el detalle del árbol");
      }
    };

    fetchTreeDetail();
  }, [token, route, selectedTreeId, trees]);

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
      setError("Solo administradores pueden subir imágenes");
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
        setError("No se pudieron subir las imágenes");
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
      setError("No se pudieron subir las imágenes");
    } finally {
      setUploadingSpaceImages(false);
    }
  };

  const saveGreenSpace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Solo administradores pueden registrar áreas verdes");
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
        setError("No se pudo guardar el área verde");
        return;
      }

      resetGreenSpaceForm();
      setShowGreenSpaceModal(false);
      fetchGreenSpaces();
      setSuccessMessage(
        editingGreenSpace
          ? "Área verde actualizada correctamente."
          : "Área verde registrada correctamente.",
      );
      setError(null);
    } catch {
      setError("No se pudo guardar el área verde");
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
      setError("Solo administradores pueden eliminar áreas verdes");
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
        setError("No se pudo eliminar el área verde");
        return;
      }

      if (editingGreenSpace?.id === id) {
        resetGreenSpaceForm();
      }
      fetchGreenSpaces();
      setSuccessMessage("Área verde eliminada correctamente.");
      setError(null);
    } catch {
      setError("No se pudo eliminar el área verde");
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

  const submitGreenSpaceReview = async (greenSpaceId: number) => {
    if (!token) {
      setError("Debes iniciar sesión para enviar una reseña");
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
        setError("No se pudo guardar tu reseña");
        return;
      }

      setSuccessMessage("Reseña guardada correctamente.");
      setError(null);
      setReviewDrafts((prev) => ({
        ...prev,
        [greenSpaceId]: { rating: draft.rating, comment: "" },
      }));
      fetchGreenSpaces();
    } catch {
      setError("No se pudo guardar tu reseña");
    }
  };

  const renderAverageStars = (average: number) => {
    const safeAverage = Math.max(0, Math.min(5, average || 0));
    const stars = [1, 2, 3, 4, 5].map((value) => {
      const diff = safeAverage - (value - 1);
      if (diff >= 1) return "full";
      if (diff >= 0.5) return "half";
      return "empty";
    });

    return (
      <div
        className="avg-stars"
        aria-label={`Calificacion promedio ${safeAverage.toFixed(1)} de 5`}
      >
        {stars.map((tone, index) => (
          <span key={index} className={`avg-star ${tone}`} aria-hidden="true">
            ★
          </span>
        ))}
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
    const editingUser = adminUsers.find((entry) => entry.id === editingUserId);
    const isOriginalAdminUser = editingUser?.username === "admin";

    return (
      <AdminUserFormModal
        isOpen={showUserModal}
        editingUserId={editingUserId}
        isOriginalAdminUser={Boolean(isOriginalAdminUser)}
        userNameInput={userNameInput}
        userUsernameInput={userUsernameInput}
        userEmailInput={userEmailInput}
        userPasswordInput={userPasswordInput}
        userRoleIdInput={userRoleIdInput}
        userIsActiveInput={userIsActiveInput}
        adminRoles={adminRoles}
        onUserNameChange={setUserNameInput}
        onUserUsernameChange={setUserUsernameInput}
        onUserEmailChange={setUserEmailInput}
        onUserPasswordChange={setUserPasswordInput}
        onUserRoleIdChange={setUserRoleIdInput}
        onUserIsActiveChange={setUserIsActiveInput}
        onSubmit={saveAdminUser}
        onClose={closeUserModal}
        onDeleteEditingUser={() => {
          if (!editingUserId) return;
          deleteAdminUser(editingUserId);
        }}
      />
    );
  };

  const renderUserDetailsModal = () => {
    const targetUser = adminUsers.find((entry) => entry.id === detailsUserId);
    return (
      <UserDetailsModal
        isOpen={showUserDetailsModal}
        user={targetUser || null}
        onClose={closeUserDetailsModal}
      />
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
  };

  useEffect(() => {
    if (route === "/profile") {
      loadProfileForm();
    }
  }, [route, user]);

  const cancelProfileEditing = () => {
    loadProfileForm();
    setError(null);
    setIsProfileEditing(false);
  };

  const openProfileEditModal = () => {
    loadProfileForm();
    setError(null);
    setIsProfileEditing(true);
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
      setIsProfileEditing(false);
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
      <LoginView
        username={username}
        password={password}
        showPasswordField={showPasswordField}
        successMessage={successMessage}
        successVisible={successVisible}
        error={error}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onTogglePassword={() => setShowPasswordField((visible) => !visible)}
        onLogin={login}
        onGoRegister={() => navigate("/register")}
      />
    );
  }

  if (route === "/register") {
    return (
      <RegisterView
        registerName={registerName}
        username={username}
        email={email}
        password={password}
        error={error}
        onRegisterNameChange={setRegisterName}
        onUsernameChange={setUsername}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onRegister={register}
        onBackToLogin={() => navigate("/login")}
      />
    );
  }

  const renderProfileSection = () => (
    <ProfilePage
      name={user?.name || ""}
      username={user?.username || ""}
      email={user?.email || ""}
      avatarUrl={resolveAvatarUrl(user?.avatarUrl) || "/default-avatar.svg"}
      onEdit={openProfileEditModal}
      onChangePassword={openPasswordModal}
      onBack={() => navigate("/")}
      error={error}
    />
  );

  const renderProfileEditModal = () => {
    return (
      <ProfileForm
        isOpen={isProfileEditing}
        profileName={profileName}
        profileUsername={profileUsername}
        profileEmail={profileEmail}
        profileAvatarUrl={profileAvatarUrl}
        error={error}
        onClose={cancelProfileEditing}
        onSave={updateProfile}
        onAvatarFile={handleAvatarFile}
        setProfileName={setProfileName}
        setProfileUsername={setProfileUsername}
        setProfileEmail={setProfileEmail}
        setProfileAvatarUrl={setProfileAvatarUrl}
      />
    );
  };

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
    if (user?.role !== "admin") return null;

    return (
      <GreenSpaceFormModal
        isOpen={showGreenSpaceModal}
        isEditing={Boolean(editingGreenSpace)}
        spaceName={spaceName}
        spaceLocation={spaceLocation}
        spaceArea={spaceArea}
        spaceTrees={spaceTrees}
        spaceImagePreviewList={spaceImagePreviewList}
        uploadingSpaceImages={uploadingSpaceImages}
        onSpaceNameChange={setSpaceName}
        onSpaceLocationChange={setSpaceLocation}
        onSpaceAreaChange={setSpaceArea}
        onSpaceTreesChange={setSpaceTrees}
        onUploadGreenSpaceImages={uploadGreenSpaceImages}
        onResolveAssetUrl={resolveAssetUrl}
        onSubmit={saveGreenSpace}
        onClose={closeGreenSpaceModal}
        onDelete={
          editingGreenSpace
            ? () => {
                deleteGreenSpace(editingGreenSpace.id);
                closeGreenSpaceModal();
              }
            : undefined
        }
      />
    );
  };

  const renderGreenSpaceDetailsModal = () => {
    const space = greenSpaces.find((entry) => entry.id === greenSpaceDetailsId);
    return (
      <GreenSpaceDetailsModal
        isOpen={showGreenSpaceDetailsModal}
        greenSpace={space || null}
        onClose={closeGreenSpaceDetailsModal}
      />
    );
  };

  const renderProposalCreateModal = () => {
    return (
      <ProposalCreateModal
        isOpen={showProposalModal}
        proposalTitleInput={proposalTitleInput}
        proposalDescriptionInput={proposalDescriptionInput}
        proposalSpaceIdInput={proposalSpaceIdInput}
        greenSpaces={greenSpaces}
        isSubmittingProposal={isSubmittingProposal}
        setProposalTitleInput={setProposalTitleInput}
        setProposalDescriptionInput={setProposalDescriptionInput}
        setProposalSpaceIdInput={setProposalSpaceIdInput}
        onSubmit={submitProposal}
        onClose={closeCreateProposalModal}
      />
    );
  };

  const renderProposalDetailSection = () => {
    const proposal =
      proposals.find((entry) => entry.id === selectedProposalId) || null;

    const projectDetails = selectedProposalId
      ? proposalProjectDetails[selectedProposalId]
      : undefined;
    const project = projectDetails?.project;
    const isProjectLoading = proposalProjectLoadingId === selectedProposalId;

    const votingWindow = selectedProposalId
      ? proposalWindows[selectedProposalId] || {
          start: "",
          end: "",
          minimumVotesRequired: proposal?.minimumVotesRequired
            ? String(proposal.minimumVotesRequired)
            : "",
        }
      : { start: "", end: "", minimumVotesRequired: "" };

    return (
      <ProposalDetailSection
        selectedProposalId={selectedProposalId}
        proposal={proposal}
        projectDetails={projectDetails}
        isProjectLoading={isProjectLoading}
        userRole={user?.role}
        proposalActionLoadingId={proposalActionLoadingId}
        votingStart={votingWindow.start}
        votingEnd={votingWindow.end}
        minimumVotesRequired={votingWindow.minimumVotesRequired}
        onChangeVotingStart={(value) => {
          if (!selectedProposalId) return;
          setProposalVotingStart(selectedProposalId, value);
        }}
        onChangeVotingEnd={(value) => {
          if (!selectedProposalId) return;
          setProposalVotingEnd(selectedProposalId, value);
        }}
        onChangeMinimumVotesRequired={(value) => {
          if (!selectedProposalId) return;
          setProposalMinimumVotesRequired(selectedProposalId, value);
        }}
        onVoteProposal={voteProposal}
        onAcceptProposal={(proposalId) => {
          void decideProposal(proposalId, "accepted");
        }}
        onRejectProposal={(proposalId) => {
          void decideProposal(proposalId, "rejected");
        }}
        onFinalizeProposal={finalizeProposal}
        onDeleteRejectedProposal={(proposalId) => {
          void deleteProposal(proposalId);
        }}
        onOpenProject={(projectId) => navigate(`/projects/${projectId}`)}
        onBack={() => navigate("/proposals")}
      />
    );
  };

  const renderGreenSpacesSection = () => (
    <GreenSpacesSection
      greenSpaces={greenSpaces}
      userRole={user?.role}
      onResolveAssetUrl={resolveAssetUrl}
      onRenderAverageStars={renderAverageStars}
      onNavigateGreenSpace={(id) => navigate(`/green-spaces/${id}`)}
      onOpenCreateGreenSpaceModal={openCreateGreenSpaceModal}
      greenSpaceModal={renderGreenSpaceModal()}
      greenSpaceDetailsModal={renderGreenSpaceDetailsModal()}
    />
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
    const communityAverageRating =
      selectedGreenSpace.reviewSummary?.averageRating ?? 0;
    const communityTotalVotes =
      selectedGreenSpace.reviewSummary?.totalReviews ?? 0;

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
          <button
            type="button"
            onClick={() => navigate(`/trees?spaceId=${selectedGreenSpace.id}`)}
          >
            Ver arboles de esta area
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
                <span className="rating-votes-count">
                  ({selectedGreenSpace.reviewSummary?.totalReviews ?? 0} votos)
                </span>
              </div>
            </div>
            <div className="summary-item">
              <span>Total de reseñas</span>
              <strong>
                {selectedGreenSpace.reviewSummary?.totalReviews ?? 0}
              </strong>
            </div>
          </div>

          {greenSpaceImages.length > 0 && (
            <ImageCarousel
              images={greenSpaceImages}
              title={selectedGreenSpace.name}
              resolveAssetUrl={resolveAssetUrl}
            />
          )}

          <div className="green-space-review-box">
            <h4>Califica este espacio (0 a 5 estrellas)</h4>
            <div className="community-rating-summary">
              <span>Valoracion de la comunidad</span>
              <div className="detail-rating-row">
                {renderAverageStars(communityAverageRating)}
                <strong>{communityAverageRating.toFixed(1)} / 5</strong>
                <span className="rating-votes-count">
                  ({communityTotalVotes} votos)
                </span>
              </div>
            </div>
            {isGuest ? (
              <div className="button-row">
                <p className="muted">
                  Inicia sesion para calificar y dejar comentarios.
                </p>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => navigate("/login")}
                >
                  Iniciar sesión
                </button>
              </div>
            ) : (
              <>
                <p className="muted">Tu calificacion</p>
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
                    onClick={() =>
                      submitGreenSpaceReview(selectedGreenSpace.id)
                    }
                  >
                    Guardar reseña
                  </button>
                </div>
              </>
            )}
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

  const renderProjectDetailSection = () => {
    return (
      <ProjectDetailSection
        selectedProjectEntry={resolvedSelectedProjectEntry}
        selectedProjectId={selectedProjectId}
        projectEntriesCount={projectEntries.length}
        proposalProjectDetails={proposalProjectDetails}
        proposalProjectLoadingId={proposalProjectLoadingId}
        projectStatusDrafts={projectStatusDrafts}
        setProjectStatusDrafts={setProjectStatusDrafts}
        isUpdatingProjectStatus={isUpdatingProjectStatus}
        isSubmittingProjectUpdate={isSubmittingProjectUpdate}
        uploadingProjectUpdateImages={uploadingProjectUpdateImages}
        projectUpdateTitleInput={projectUpdateTitleInput}
        projectUpdateDescriptionInput={projectUpdateDescriptionInput}
        projectUpdateImagesInput={projectUpdateImagesInput}
        setProjectUpdateTitleInput={setProjectUpdateTitleInput}
        setProjectUpdateDescriptionInput={setProjectUpdateDescriptionInput}
        setProjectUpdateImagesInput={setProjectUpdateImagesInput}
        onBack={() => navigate("/projects")}
        onOpenProjectActivityDetail={(updateId) =>
          resolvedSelectedProjectEntry
            ? navigate(
                `/projects/${resolvedSelectedProjectEntry.project.id}/updates/${updateId}`,
              )
            : navigate("/projects")
        }
        onUpdateProjectCompletedStatus={updateProjectCompletedStatus}
        onSubmitProjectActivityUpdate={submitProjectActivityUpdate}
        onUploadProjectActivityImages={uploadProjectActivityImages}
        getSpaceName={getSpaceName}
        summarizeText={summarizeText}
        formatUpdatedAt={formatUpdatedAt}
        resolveAssetUrl={resolveAssetUrl}
        userRole={user?.role}
      />
    );
  };

  const renderProjectActivityDetailSection = () => {
    return (
      <ProjectActivityDetailSection
        selectedProjectEntry={resolvedSelectedProjectEntry}
        selectedProjectId={selectedProjectId}
        selectedProjectUpdateId={selectedProjectUpdateId}
        projectEntriesCount={projectEntries.length}
        proposalProjectDetails={proposalProjectDetails}
        proposalProjectLoadingId={proposalProjectLoadingId}
        userRole={user?.role}
        isSubmittingProjectUpdate={isSubmittingProjectUpdate}
        uploadingProjectUpdateImages={uploadingProjectUpdateImages}
        projectUpdateTitleInput={projectUpdateTitleInput}
        projectUpdateDescriptionInput={projectUpdateDescriptionInput}
        projectUpdateImagesInput={projectUpdateImagesInput}
        setProjectUpdateTitleInput={setProjectUpdateTitleInput}
        setProjectUpdateDescriptionInput={setProjectUpdateDescriptionInput}
        setProjectUpdateImagesInput={setProjectUpdateImagesInput}
        onUploadProjectActivityImages={uploadProjectActivityImages}
        onUpdateProjectActivityUpdate={updateProjectActivityUpdate}
        onDeleteProjectActivityUpdate={deleteProjectActivityUpdate}
        onBackToProject={() => {
          if (!resolvedSelectedProjectEntry) {
            navigate("/projects");
            return;
          }
          navigate(`/projects/${resolvedSelectedProjectEntry.project.id}`);
        }}
        onBackToProjects={() => navigate("/projects")}
        resolveAssetUrl={resolveAssetUrl}
        formatUpdatedAt={formatUpdatedAt}
      />
    );
  };

  const getSpaceName = (spaceId: number) => {
    const target = greenSpaces.find((space) => space.id === spaceId);
    return target?.name || `Area #${spaceId}`;
  };

  const renderAdminUsersSection = () => {
    return (
      <AdminUsersSection
        adminUsers={adminUsers}
        onOpenCreateUserModal={openCreateUserModal}
        onOpenEditUserModal={openEditUserModal}
        userModal={renderUserModal()}
        userDetailsModal={renderUserDetailsModal()}
      />
    );
  };

  const renderProposalsSection = () => {
    const isProjectsRoute = route === "/projects";

    if (isProjectsRoute) {
      return (
        <ProjectsListSection
          projectEntries={projectEntries}
          onOpenProjectPage={openProjectDetailPage}
          getSpaceName={getSpaceName}
        />
      );
    }

    return (
      <>
        <ProposalsListSection
          proposals={proposals}
          proposalStatusFilter={proposalStatusFilter}
          setProposalStatusFilter={setProposalStatusFilter}
          proposalProjectStatusByProposalId={proposalProjectStatusByProposalId}
          getSpaceName={getSpaceName}
          formatUpdatedAt={formatUpdatedAt}
          onOpenCreateProposalModal={
            isAuthenticated ? openCreateProposalModal : undefined
          }
          onOpenProposalDetailPage={openProposalDetailPage}
        />
        {renderProposalCreateModal()}
      </>
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
    const principalQuickActions = [
      {
        id: "gm",
        badge: "GM",
        title: "Módulo GreenMetric",
        hint: `${greenMetricRecords.length} cálculos disponibles`,
        onClick: () => navigate("/green-metrics"),
      },
      {
        id: "rp",
        badge: "RP",
        title: "Centro de reportes",
        hint: `${reports.length} reportes registrados`,
        onClick: () => navigate("/reports"),
      },
      {
        id: "av",
        badge: "AV",
        title: "Gestión de áreas verdes",
        hint: `${greenSpaces.length} áreas activas`,
        onClick: () => navigate("/green-spaces"),
      },
    ];
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
            <h3>Accesos rápidos</h3>
            <p className="muted">
              Navega directo a los módulos clave para actualizar datos y revisar
              reportes.
            </p>
            <div className="principal-quick-actions">
              {principalQuickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="quick-action-button"
                  onClick={action.onClick}
                >
                  <span className="quick-action-badge" aria-hidden="true">
                    {action.badge}
                  </span>
                  <span className="quick-action-copy">
                    <strong className="quick-action-title">{action.title}</strong>
                    <small className="quick-action-hint">{action.hint}</small>
                  </span>
                </button>
              ))}
            </div>
          </article>

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

  const renderReportsSection = () => {
    return (
      <Reports
        reports={reports}
        greenSpaces={greenSpaces}
        reportStateFilter={reportStateFilter}
        setReportStateFilter={setReportStateFilter}
        showReportCreateModal={showReportCreateModal}
        reportTitleInput={reportTitleInput}
        reportDescriptionInput={reportDescriptionInput}
        reportSpaceIdInput={reportSpaceIdInput}
        editingReportStateInput={editingReportStateInput}
        isSubmittingReport={isSubmittingReport}
        formatUpdatedAt={formatUpdatedAt}
        onOpenCreateReportModal={
          isAuthenticated ? openCreateReportModal : undefined
        }
        onCloseCreateReportModal={closeCreateReportModal}
        onSaveReport={saveReport}
        setReportTitleInput={setReportTitleInput}
        setReportDescriptionInput={setReportDescriptionInput}
        setReportSpaceIdInput={setReportSpaceIdInput}
        setEditingReportStateInput={setEditingReportStateInput}
        onOpenReportDetail={(reportId) => navigate(`/reports/${reportId}`)}
      />
    );
  };

  const renderGreenMetricsSection = () => {
    return (
      <GreenMetricsSection
        records={greenMetricRecords}
        latestRecord={latestGreenMetricRecord}
        formInput={greenMetricFormInput}
        isSubmitting={isSubmittingGreenMetric}
        isLoading={isLoadingGreenMetrics}
        userRole={user?.role}
        onSetFormValue={setGreenMetricFormValue}
        onSave={saveRecord}
      />
    );
  };

  const renderReportDetailSection = () => {
    return (
      <Report
        selectedReportId={selectedReportId}
        selectedReport={selectedReport}
        greenSpaces={greenSpaces}
        currentUserId={user?.id}
        currentUserRole={user?.role}
        showReportEditModal={showReportEditModal}
        reportTitleInput={reportTitleInput}
        reportDescriptionInput={reportDescriptionInput}
        reportSpaceIdInput={reportSpaceIdInput}
        editingReportStateInput={editingReportStateInput}
        isSubmittingReport={isSubmittingReport}
        onBack={() => navigate("/reports")}
        onOpenEditReportModal={openEditReportModal}
        onCloseEditReportModal={closeEditReportModal}
        onSaveReport={saveReport}
        setReportTitleInput={setReportTitleInput}
        setReportDescriptionInput={setReportDescriptionInput}
        setReportSpaceIdInput={setReportSpaceIdInput}
        setEditingReportStateInput={setEditingReportStateInput}
        onDeleteReport={deleteReport}
        onCompleteReport={completeReport}
        resolveAssetUrl={resolveAssetUrl}
        formatUpdatedAt={formatUpdatedAt}
      />
    );
  };

  const renderTreeTypesSection = () => {
    return (
      <TreeTypesSection
        treeTypes={treeTypes}
        userRole={user?.role}
        onOpenTreeTypeDetail={(treeType) =>
          navigate(`/tree-types/${treeType.id}`)
        }
        treeTypeNameInput={treeTypeNameInput}
        treeTypeDescriptionInput={treeTypeDescriptionInput}
        treeTypeImagesInput={treeTypeImagesInput}
        isSubmittingTreeType={isSubmittingTreeType}
        uploadingTreeTypeImages={uploadingTreeTypeImages}
        resolveAssetUrl={resolveAssetUrl}
        formatUpdatedAt={formatUpdatedAt}
        setTreeTypeNameInput={setTreeTypeNameInput}
        setTreeTypeDescriptionInput={setTreeTypeDescriptionInput}
        setTreeTypeImagesInput={setTreeTypeImagesInput}
        onResetTreeTypeForm={resetTreeTypeForm}
        onSaveTreeType={saveTreeType}
        onUploadTreeTypeImages={(event) => {
          void uploadTreeTypeImages(event);
        }}
      />
    );
  };

  const renderTreeTypeDetailSection = () => {
    return (
      <TreeTypeDetailSection
        selectedTreeTypeId={selectedTreeTypeId}
        selectedTreeType={selectedTreeType}
        treesOfType={treeTypeInventoryRows}
        userRole={user?.role}
        onBack={() => navigate("/tree-types")}
        onOpenTreeDetail={(tree) => navigate(`/trees/${tree.id}`)}
        treeTypeNameInput={treeTypeNameInput}
        treeTypeDescriptionInput={treeTypeDescriptionInput}
        treeTypeImagesInput={treeTypeImagesInput}
        isSubmittingTreeType={isSubmittingTreeType}
        uploadingTreeTypeImages={uploadingTreeTypeImages}
        setTreeTypeNameInput={setTreeTypeNameInput}
        setTreeTypeDescriptionInput={setTreeTypeDescriptionInput}
        setTreeTypeImagesInput={setTreeTypeImagesInput}
        onResetTreeTypeForm={resetTreeTypeForm}
        onStartEditTreeType={startEditTreeType}
        onSaveTreeType={saveTreeType}
        onDeleteTreeType={deleteTreeType}
        onUploadTreeTypeImages={(event) => {
          void uploadTreeTypeImages(event);
        }}
        resolveAssetUrl={resolveAssetUrl}
        formatUpdatedAt={formatUpdatedAt}
      />
    );
  };

  const renderTreesSection = () => {
    return (
      <TreesSection
        trees={trees}
        treeTypes={treeTypes}
        greenSpaces={greenSpaces}
        userRole={user?.role}
        selectedSpaceFilterName={selectedSpaceFilterName}
        onOpenGreenSpaces={() => navigate("/green-spaces")}
        onClearSpaceFilter={() => navigate("/trees")}
        treeNameInput={treeNameInput}
        treeHealthStatusInput={treeHealthStatusInput}
        treeTypeIdInput={treeTypeIdInput}
        treeSpaceIdInput={treeSpaceIdInput}
        treeImagesInput={treeImagesInput}
        isSubmittingTree={isSubmittingTree}
        uploadingTreeImages={uploadingTreeImages}
        treeActionLoadingId={treeActionLoadingId}
        resolveAssetUrl={resolveAssetUrl}
        formatUpdatedAt={formatUpdatedAt}
        setTreeNameInput={setTreeNameInput}
        setTreeHealthStatusInput={setTreeHealthStatusInput}
        setTreeTypeIdInput={setTreeTypeIdInput}
        setTreeSpaceIdInput={setTreeSpaceIdInput}
        setTreeImagesInput={setTreeImagesInput}
        onResetTreeForm={resetTreeForm}
        onOpenTreeDetail={(tree) => navigate(`/trees/${tree.id}`)}
        onUploadTreeImages={(event) => {
          void uploadTreeImages(event);
        }}
        onSaveTree={saveTree}
        onApproveTree={(treeId) => {
          void approveTree(treeId);
        }}
        onRejectTree={(treeId) => {
          void rejectTree(treeId);
        }}
      />
    );
  };

  const renderTreeDetailSection = () => {
    return (
      <TreeDetailSection
        selectedTreeId={selectedTreeId}
        selectedTree={selectedTreeDetail}
        userRole={user?.role}
        treeTypes={treeTypes}
        greenSpaces={greenSpaces}
        treeNameInput={treeNameInput}
        treeHealthStatusInput={treeHealthStatusInput}
        treeTypeIdInput={treeTypeIdInput}
        treeSpaceIdInput={treeSpaceIdInput}
        treeImagesInput={treeImagesInput}
        isSubmittingTree={isSubmittingTree}
        uploadingTreeImages={uploadingTreeImages}
        setTreeNameInput={setTreeNameInput}
        setTreeHealthStatusInput={setTreeHealthStatusInput}
        setTreeTypeIdInput={setTreeTypeIdInput}
        setTreeSpaceIdInput={setTreeSpaceIdInput}
        setTreeImagesInput={setTreeImagesInput}
        onResetTreeForm={resetTreeForm}
        onStartEditTree={startEditTree}
        onUploadTreeImages={(event) => {
          void uploadTreeImages(event);
        }}
        onSaveTree={saveTree}
        onDeleteTree={deleteTree}
        onBack={() => navigate("/trees")}
        onOpenTrees={() => navigate("/trees")}
        onOpenTreeType={(treeTypeId) => navigate(`/tree-types/${treeTypeId}`)}
        onOpenGreenSpace={(spaceId) => navigate(`/green-spaces/${spaceId}`)}
        resolveAssetUrl={resolveAssetUrl}
        formatUpdatedAt={formatUpdatedAt}
      />
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

    if (route.startsWith("/projects/")) {
      if (route.includes("/updates/")) {
        return renderProjectActivityDetailSection();
      }
      return renderProjectDetailSection();
    }

    if (route.startsWith("/proposals/")) {
      return renderProposalDetailSection();
    }

    if (route.startsWith("/reports/")) {
      return renderReportDetailSection();
    }

    if (route.startsWith("/tree-types/")) {
      return renderTreeTypeDetailSection();
    }

    if (route.startsWith("/trees/")) {
      return renderTreeDetailSection();
    }

    if (route === "/green-spaces") {
      return renderGreenSpacesSection();
    }

    if (route === "/proposals") {
      return renderProposalsSection();
    }

    if (route === "/projects") {
      return renderProposalsSection();
    }

    if (route === "/reports") {
      return renderReportsSection();
    }

    if (route === "/green-metrics") {
      return renderGreenMetricsSection();
    }

    if (route === "/tree-types") {
      return renderTreeTypesSection();
    }

    if (route === "/trees" || route.startsWith("/trees?")) {
      return renderTreesSection();
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
        aria-controls="app-sidebar"
        aria-label={sidebarOpen ? "Cerrar menu" : "Abrir menu"}
      >
        ☰
      </button>
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Cerrar menu lateral"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        id="app-sidebar"
        className={`sidebar ${sidebarOpen ? "open" : "closed"}`}
      >
        <AppSidebar
          route={route}
          isAuthenticated={isAuthenticated}
          isGreenSpacesRoute={isGreenSpacesRoute}
          isProjectsRoute={isProjectsRoute}
          isReportsRoute={isReportsRoute}
          isGreenMetricsRoute={isGreenMetricsRoute}
          isTreeTypesRoute={isTreeTypesRoute}
          isTreesRoute={isTreesRoute}
          answeredPolls={answeredPolls}
          unansweredPolls={unansweredPolls}
          displayName={displayName}
          userRole={user?.role}
          avatarUrl={resolveAvatarUrl(user?.avatarUrl)}
          onNavigateHome={() => navigate("/")}
          onNavigateProfile={() => navigate("/profile")}
          onNavigateGreenSpaces={() => navigate("/green-spaces")}
          onNavigateProposals={() => navigate("/proposals")}
          onNavigateProjects={openProjects}
          onNavigateReports={() => navigate("/reports")}
          onNavigateGreenMetrics={() => navigate("/green-metrics")}
          onNavigateTreeTypes={() => navigate("/tree-types")}
          onNavigateTrees={() => navigate("/trees")}
          onNavigateUsers={() => navigate("/admin-users")}
          onLogin={() => navigate("/login")}
          onLogout={logout}
        />
      </aside>
      <main className="main-content">
        {renderMainSection()}
        {renderProfileEditModal()}
        {renderPasswordModal()}
      </main>
      <AiChatWidget token={token} isAuthenticated={isAuthenticated} />
    </div>
  );
}

export default App;
