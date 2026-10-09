interface AuthPlantProps {
  side: "left" | "right";
}

export function AuthPlant({ side }: AuthPlantProps) {
  return (
    <div
      className={`auth-plant ${side === "left" ? "auth-plant-left" : "auth-plant-right"}`}
      aria-hidden="true"
    >
      <svg
        className="auth-plant-illustration"
        viewBox="0 0 180 520"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="plant-stem-path"
          d="M89 510 C76 428 82 338 92 278 C101 228 100 168 86 96"
        />
        <path
          className="plant-vein-path"
          d="M91 332 C108 316 124 296 134 270"
        />
        <path
          className="plant-vein-path"
          d="M86 368 C70 346 56 316 50 286"
        />
        <path
          className="plant-leaf leaf-1"
          d="M89 112 C64 76 42 72 28 95 C44 116 62 130 88 138 Z"
        />
        <path
          className="plant-leaf leaf-2"
          d="M90 164 C114 132 139 124 156 143 C144 168 125 184 95 191 Z"
        />
        <path
          className="plant-leaf leaf-3"
          d="M91 224 C66 191 43 190 30 214 C44 235 64 252 90 259 Z"
        />
        <path
          className="plant-leaf leaf-4"
          d="M93 286 C118 255 144 250 160 269 C146 290 126 307 97 313 Z"
        />
        <path
          className="plant-leaf leaf-5"
          d="M90 350 C66 320 42 316 26 338 C40 362 62 379 90 384 Z"
        />
        <path
          className="plant-leaf leaf-6"
          d="M92 412 C117 383 143 378 160 396 C145 419 126 436 96 442 Z"
        />
      </svg>
    </div>
  );
}
