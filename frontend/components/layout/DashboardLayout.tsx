'use client';

import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Calculator,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Landmark,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  RadioTower,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Truck,
  UserRoundCog,
  Users,
  WalletCards,
  X,
  Loader2,
} from 'lucide-react';

import Link from 'next/link';

import {
  usePathname,
  useRouter,
} from 'next/navigation';

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type {
  LucideIcon,
} from 'lucide-react';

import {
  getCompany,
} from '@/services/company';

/* =========================================================
   TIPOS
========================================================= */

type Company = {
  id?: string;
  name?: string;
  nif?: string;
  regime?: string;
  companyType?: string | null;
  sector?: string | null;
};

type DashboardLayoutProps = {
  children: ReactNode;
  company?: Company;
};

/* =========================================================
   NAVEGAÇÃO PRINCIPAL
========================================================= */

const navigationSections = [
  {
    title: 'Principal',

    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },

      {
        label: 'Calendário Fiscal',
        href: '/calendar',
        icon: CalendarDays,
      },
    ],
  },

  {
    title: 'Gestão',

    items: [
      {
        label: 'Funcionários',
        href: '/employees',
        icon: Users,
      },

      {
        label: 'Folha Salarial',
        href: '/payroll',
        icon: WalletCards,
      },

      {
        label: 'Clientes',
        href: '/clients',
        icon: UserRoundCog,
      },

      {
        label: 'Produtos',
        href: '/products',
        icon: Package,
      },

      {
        label: 'Fornecedores',
        href: '/suppliers',
        icon: Truck,
      },
    ],
  },

  {
    title: 'Fiscalidade',

    items: [
      {
        label: 'Simulador de Impostos',
        href: '/simulator',
        icon: Calculator,
      },

      {
        label: 'Obrigações Fiscais',
        href: '/obligations',
        icon: ShieldCheck,
      },

      {
        label: 'Central Fiscal',
        href: '/fiscal-situation',
        icon: ShieldAlert,
      },
      {
        label: 'Enquadramentos',
        href: '/fiscal-enrollments',
        icon: ShieldCheck,
      },

      {
        label: 'Pagamentos',
        href: '/payments',
        icon: CreditCard,
      },

      {
        label: 'Faturação',
        href: '/invoices',
        icon: ReceiptText,
      },

      {
        label: 'Facturação Electrónica',
        href: '/electronic-invoicing',
        icon: RadioTower,
      },

      {
        label: 'Facturas Recebidas',
        href: '/purchase-invoices',
        icon: FileText,
      },

      {
        label: 'Pro Formas',
        href: '/pro-formas',
        icon: FileText,
      },

      {
        label: 'Relatórios',
        href: '/reports',
        icon: FileText,
      },

      {
        label: 'SAF-T contabilístico',
        href: '/accounting/saft',
        icon: FileSpreadsheet,
      },
    ],
  },

  {
    title: 'Documentação',

    items: [
      {
        label: 'Documentos',
        href: '/library',
        icon: Library,
      },

      {
        label: 'Legislação Fiscal',
        href: '/legislation',
        icon: BookOpen,
      },

      {
        label: 'Educação Fiscal',
        href: '/assistant',
        icon: Landmark,
      },
    ],
  },

  {
    title: 'Comunicação',

    items: [
      {
        label: 'Notificações',
        href: '/notifications',
        icon: Bell,
      },
    ],
  },
];

/* =========================================================
   NAVEGAÇÃO DA EMPRESA
========================================================= */

const companyNavigation = [
  {
    label: 'Perfil da Empresa',
    href: '/company',
    icon: Building2,
  },

  {
    label: 'Utilizadores',
    href: '/users',
    icon: UserRoundCog,
  },

  {
    label: 'Definições',
    href: '/settings',
    icon: Settings,
  },

];

/* =========================================================
   COMPONENTE
========================================================= */

export default function DashboardLayout({
  children,
  company: companyProp,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  /* =======================================================
     ESTADOS
  ======================================================= */

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [loadedCompany, setLoadedCompany] =
    useState<Company | null>(null);

  const [loadingCompany, setLoadingCompany] =
    useState(!companyProp);

  const [isNavigating, setIsNavigating] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  /* =======================================================
     TRANSIÇÃO DA PÁGINA
  ======================================================= */

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  /* =======================================================
     ESC FECHA MOBILE
  ======================================================= */

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    window.addEventListener(
      'keydown',
      handleEscape,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [mobileOpen]);

  /* =======================================================
     BLOQUEAR SCROLL QUANDO MENU MOBILE ESTÁ ABERTO
  ======================================================= */

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  /* =======================================================
     EMPRESA AUTENTICADA
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadCompany() {
      try {
        setLoadingCompany(true);

        const data =
          await getCompany();

        if (
          mounted &&
          data
        ) {
          setLoadedCompany({
            id: data?.id,
            name: data?.name,
            nif: data?.nif,
            regime: data?.regime,
            companyType:
              data?.companyType,
            sector:
              data?.sector,
          });
        }
      } catch (error) {
        console.error(
          'Não foi possível carregar a empresa autenticada.',
          error,
        );
      } finally {
        if (mounted) {
          setLoadingCompany(false);
        }
      }
    }

    if (!companyProp) {
      loadCompany();
    } else {
      setLoadingCompany(false);
    }

    return () => {
      mounted = false;
    };
  }, [companyProp]);

  /* =======================================================
     EMPRESA ATUAL
  ======================================================= */

  const currentCompany =
    companyProp ??
    loadedCompany;

  /* =======================================================
     NOME DA EMPRESA
  ======================================================= */

  const companyName =
    currentCompany?.name?.trim() ||
    (
      loadingCompany
        ? 'A carregar empresa...'
        : 'Empresa'
    );

  /* =======================================================
     NIF
  ======================================================= */

  const companyNif =
    currentCompany?.nif?.trim() ||
    'NIF não disponível';

  const currentNavigation = [
    ...navigationSections.flatMap(
      (section) =>
        section.items.map((item) => ({
          ...item,
          section: section.title,
        })),
    ),
    ...companyNavigation.map((item) => ({
      ...item,
      section: 'Empresa',
    })),
  ].find(
    (item) =>
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`),
  );

  /* =======================================================
     INICIAIS
  ======================================================= */

  const initials =
    useMemo(() => {
      const name =
        currentCompany?.name?.trim();

      if (!name) {
        return 'FD';
      }

      const words =
        name
          .split(/\s+/)
          .filter(Boolean);

      if (
        words.length === 1
      ) {
        return words[0]
          .slice(0, 2)
          .toUpperCase();
      }

      return (
        `${words[0][0]}${words[1][0]}`
      ).toUpperCase();
    }, [
      currentCompany?.name,
    ]);

  /* =======================================================
     ITEM ATIVO
  ======================================================= */

  const isActive = (
    href: string,
  ) => {
    if (
      href === '/dashboard'
    ) {
      return (
        pathname === '/dashboard' ||
        pathname.startsWith(
          '/dashboard/',
        )
      );
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`,
      )
    );
  };

  /* =======================================================
     NAVEGAÇÃO
  ======================================================= */

  const handleNavigation = (
    href: string,
    mobile = false,
  ) => {
    if (
      href === pathname
    ) {
      if (mobile) {
        setMobileOpen(false);
      }

      return;
    }

    if (mobile) {
      setMobileOpen(false);
    }

    setIsNavigating(true);
  };

  /* =======================================================
     FECHAR MOBILE
  ======================================================= */

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    if (isLoggingOut) {
      return;
    }

    const confirmed =
      window.confirm(
        'Tem certeza que deseja terminar a sessão?',
      );

    if (!confirmed) {
      return;
    }

    try {
      setIsLoggingOut(true);

      /*
       * Limpa os dados de autenticação
       * guardados localmente.
       *
       * Não usamos localStorage.clear()
       * porque isso poderia apagar outras
       * informações do sistema.
       */

      const storageKeys = [
        'token',
        'accessToken',
        'refreshToken',
        'authToken',
        'user',
        'currentUser',
      ];

      storageKeys.forEach(
        (key) => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        },
      );

      /*
       * Se existir cookie de autenticação
       * acessível pelo browser, removemos
       * apenas cookies relacionados.
       */

      document.cookie
        .split(';')
        .forEach((cookie) => {
          const name =
            cookie
              .split('=')[0]
              ?.trim();

          if (
            name &&
            (
              name
                .toLowerCase()
                .includes('token') ||
              name
                .toLowerCase()
                .includes('auth') ||
              name
                .toLowerCase()
                .includes('session')
            )
          ) {
            document.cookie =
              `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          }
        });

      router.replace('/login');
    } catch (error) {
      console.error(
        'Erro ao terminar sessão:',
        error,
      );

      setIsLoggingOut(false);
    }
  };

  /* =======================================================
     ITEM DE NAVEGAÇÃO
  ======================================================= */

  const renderNavigationItem = (
    item: {
      label: string;
      href: string;
      icon: LucideIcon;
    },
    mobile = false,
  ) => {
    const Icon =
      item.icon;

    const active =
      isActive(
        item.href,
      );

    return (
      <Link
        key={item.label}
        href={item.href}
        prefetch
        onClick={() =>
          handleNavigation(
            item.href,
            mobile,
          )
        }
        aria-current={
          active
            ? 'page'
            : undefined
        }
        className={`
          group
          relative
          flex
          h-[42px]
          w-full
          select-none
          items-center
          gap-3
          rounded-md
          px-3.5

          ${
            active
              ? `
                bg-[#eaf4f8]
                font-semibold
                text-[#075f86]
              `
              : `
                text-[#405275]
                hover:bg-[#f5f9fd]
                hover:text-[#0877e8]
              `
          }

          transition-[background-color,color,box-shadow]
          duration-150
          ease-out
        `}
      >
        {active && (
          <span
            className="
              absolute
              left-0
              top-1/2
              h-6
              w-[3px]
              -translate-y-1/2
              bg-[#0787ad]
            "
          />
        )}

        <span
          className={`
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-lg

            ${
              active
                ? 'text-[#075f86]'
                : 'group-hover:text-[#075f86]'
            }

            transition-[background-color,box-shadow]
            duration-150
          `}
        >
          <Icon
            size={18}
            strokeWidth={
              active
                ? 2.3
                : 1.8
            }
            className="
              transition-colors
              duration-150
            "
          />
        </span>

        <span
          className="
            min-w-0
            flex-1
            truncate
            text-[13px]
            tracking-[-0.01em]
          "
        >
          {item.label}
        </span>

        {isNavigating &&
          active === false &&
          false && (
            <Loader2
              size={13}
              className="
                animate-spin
                text-[#079fe5]
              "
            />
          )}
      </Link>
    );
  };

  /* =======================================================
     SIDEBAR
  ======================================================= */

  const renderSidebar = (
    mobile = false,
  ) => (
    <div
      className="
        flex
        h-full
        min-h-0
        w-full
        flex-col
      "
    >
      {/* =================================================
          LOGO
      ================================================= */}

      <div
        className="
          flex
          h-[82px]
          shrink-0
          items-center
          border-b
          border-[#edf1f6]
          px-5
        "
      >
        <Link
          href="/dashboard"
          prefetch
          onClick={() =>
            handleNavigation(
              '/dashboard',
              mobile,
            )
          }
          className="
            group
            flex
            min-w-0
            items-center
            gap-3
          "
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#dbe5ed] bg-white">
            <img
              src="/logofiscalidade.png"
              alt="Fiscalidade Digital"
              className="
                h-7
                w-7
                object-contain
              "
            />
          </div>

          <div className="min-w-0">
            <div
              className="
                truncate
                text-[17px]
                font-extrabold
                tracking-[-0.035em]
                text-[#101b3d]
              "
            >
              Fiscalidade
              <span className="text-[#079fe5]">
                {' '}Digital
              </span>
            </div>

            <div
              className="
                mt-0.5
                whitespace-nowrap
                text-[9px]
                font-medium
                uppercase
                tracking-[0.08em]
                text-[#7c8cae]
              "
            >
              Gestão Fiscal Inteligente
            </div>
          </div>
        </Link>

        {mobile && (
          <button
            type="button"
            onClick={
              closeMobileMenu
            }
            className="
              ml-auto
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-[#536486]
              transition-colors
              duration-150
              hover:bg-[#f3f7fb]
              hover:text-[#0877e8]
            "
            aria-label="Fechar menu"
          >
            <X size={19} />
          </button>
        )}
      </div>

      {/* =================================================
          EMPRESA
      ================================================= */}

      <div
        className="
          shrink-0
          px-4
          pb-3
          pt-5
        "
      >
        <div
          className="
            flex
            w-full
            items-center
            gap-3
            rounded-lg
            border
            border-[#e8eef6]
            bg-[#fbfdff]
            px-3
            py-3
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-md
              bg-[#0b6f93]
              text-[11px]
              font-bold
              text-white
            "
          >
            {initials}
          </div>

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <div
              className="
                truncate
                text-[12px]
                font-bold
                text-[#152343]
              "
              title={companyName}
            >
              {companyName}
            </div>

            <div
              className="
                mt-0.5
                truncate
                text-[10px]
                text-[#8795af]
              "
              title={companyNif}
            >
              {companyNif}
            </div>
          </div>

        </div>
      </div>

      {/* =================================================
          NAVEGAÇÃO
      ================================================= */}

      <div
        className="
          min-h-0
          flex-1
          overflow-y-auto
          overscroll-contain
          px-4
          py-2
          scrollbar-thin
          scrollbar-thumb-slate-200
          scrollbar-track-transparent
        "
      >
        {navigationSections.map(
          (section) => (
            <div
              key={
                section.title
              }
              className="mb-6"
            >
              <div
                className="
                  mb-2
                  px-3
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.14em]
                  text-[#93a1ba]
                "
              >
                {section.title}
              </div>

              <nav
                className="
                  space-y-1
                "
              >
                {section.items.map(
                  (item) =>
                    renderNavigationItem(
                      item,
                      mobile,
                    ),
                )}
              </nav>
            </div>
          ),
        )}

        {/* =================================================
            EMPRESA
        ================================================= */}

        <div className="pb-5">
          <div
            className="
              mb-2
              px-3
              text-[9px]
              font-bold
              uppercase
              tracking-[0.14em]
              text-[#93a1ba]
            "
          >
            Empresa
          </div>

          <nav className="space-y-1">
            {companyNavigation.map(
              (item) =>
                renderNavigationItem(
                  item,
                  mobile,
                ),
            )}
          </nav>

          {/* =================================================
              LOGOUT
          ================================================= */}

          <div
            className="
              mt-3
              border-t
              border-[#edf1f6]
              pt-3
            "
          >
            <button
              type="button"
              onClick={handleLogout}
              disabled={
                isLoggingOut
              }
              className="
                group
                flex
                h-[42px]
                w-full
                items-center
                gap-3
                rounded-xl
                px-3.5
                text-[#6f7d96]
                transition-[background-color,color]
                duration-150
                hover:bg-[#fff5f5]
                hover:text-[#dc3545]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <span
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  transition-colors
                  duration-150
                  group-hover:bg-white
                "
              >
                {isLoggingOut ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <LogOut
                    size={18}
                    strokeWidth={1.8}
                  />
                )}
              </span>

              <span
                className="
                  text-[13px]
                  font-medium
                "
              >
                {isLoggingOut
                  ? 'A terminar sessão...'
                  : 'Terminar sessão'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div
        className="
          shrink-0
          px-4
          pb-4
          pt-2
        "
      >
        <Link
          href="/obligations"
          prefetch
          onClick={() =>
            handleNavigation(
              '/obligations',
              mobile,
            )
          }
          className="
            flex
            items-start
            gap-3
            rounded-md
            border
            border-[#dbe5ed]
            bg-[#f7fafc]
            p-3
            text-[#203451]
            transition-colors
            hover:border-[#b7d3df]
            hover:bg-[#eef6f8]
          "
        >
          <ShieldAlert
            size={17}
            className="mt-0.5 shrink-0 text-[#0b6f93]"
          />
          <div>
            <div className="text-[12px] font-semibold">
              Obrigações fiscais
            </div>
            <p className="mt-0.5 text-[10px] leading-4 text-[#718099]">
              Consulte prazos e estados de cumprimento.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="
        fd-app-shell
        fd-theme-scope
        min-h-screen
        bg-[#f3f5f7]
        text-[#101b3d]
      "
    >
      {/* =================================================
          BARRA DE PROGRESSO
      ================================================= */}

      <div
        className={`
          pointer-events-none
          fixed
          left-0
          right-0
          top-0
          z-[100]
          h-[2px]
          origin-left
          bg-[#0787ad]
          transition-all
          duration-200
          ${
            isNavigating
              ? 'scale-x-100 opacity-100'
              : 'scale-x-0 opacity-0'
          }
        `}
      />

      {/* =================================================
          SIDEBAR DESKTOP
      ================================================= */}

      <aside
        className="
          fd-sidebar
          fixed
          bottom-0
          left-0
          top-0
          z-50
          hidden
          w-[268px]
          flex-col
          overflow-hidden
          border-r
          border-[#e7edf5]
          bg-white
          lg:flex
        "
      >
        {renderSidebar(false)}
      </aside>

      {/* =================================================
          OVERLAY MOBILE
      ================================================= */}

      <div
        className={`
          fixed
          inset-0
          z-[60]
          bg-[#06142d]/45
          lg:hidden
          transition-opacity
          duration-200
          ${
            mobileOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          }
        `}
        onClick={
          closeMobileMenu
        }
        aria-hidden={
          !mobileOpen
        }
      />

      {/* =================================================
          SIDEBAR MOBILE
      ================================================= */}

      <aside
        className={`
          fd-sidebar
          fixed
          bottom-0
          left-0
          top-0
          z-[70]
          flex
          w-[290px]
          flex-col
          overflow-hidden
          border-r
          border-[#e7edf5]
          bg-white
          shadow-[12px_0_40px_rgba(15,38,75,0.10)]
          transition-transform
          duration-200
          ease-out
          lg:hidden

          ${
            mobileOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
        aria-hidden={!mobileOpen}
      >
        {renderSidebar(true)}
      </aside>

      {/* =================================================
          ÁREA PRINCIPAL
      ================================================= */}

      <div
        className="
          min-h-screen
          lg:ml-[268px]
        "
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <header
          className="
            fd-topbar
            sticky
            top-0
            z-40
            h-[68px]
            border-b
            border-[#e7edf5]
            bg-white
          "
        >
          <div
            className="
              flex
              h-full
              items-center
              justify-between
              gap-5
              px-5
              lg:px-8
            "
          >
            {/* MENU MOBILE */}

            <button
              type="button"
              onClick={() =>
                setMobileOpen(true)
              }
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-[#e1e8f1]
                bg-white
                text-[#30456d]
                transition-colors
                duration-150
                hover:border-[#b9e6f7]
                hover:text-[#0877e8]
                lg:hidden
              "
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>

            {/* CONTEXTO DA PÁGINA */}

            <div
              className="
                min-w-0
                flex-1
                items-center
                md:flex
              "
            >
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#78879d]">
                  {currentNavigation?.section ?? 'Fiscalidade Digital'}
                </p>
                <p className="truncate text-[14px] font-semibold text-[#172642]">
                  {currentNavigation?.label ?? 'Área empresarial'}
                </p>
              </div>
            </div>

            {/* DIREITA */}

            <div
              className="
                flex
                items-center
                gap-1.5
                sm:gap-3
              "
            >
              {/* NOTIFICAÇÕES */}

              <Link
                href="/notifications"
                prefetch
                onClick={() =>
                  handleNavigation(
                    '/notifications',
                  )
                }
                className="
                  relative
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  text-[#34476d]
                  transition-colors
                  duration-150
                  hover:bg-[#f3f8fc]
                  hover:text-[#0877e8]
                "
                aria-label="Notificações"
                title="Notificações"
              >
                <Bell
                  size={20}
                  strokeWidth={1.8}
                />
              </Link>

              {/* SEPARADOR */}

              <div
                className="
                  mx-1
                  hidden
                  h-8
                  w-px
                  bg-[#e7edf4]
                  sm:block
                "
              />

              {/* EMPRESA */}

              <Link
                href="/company"
                prefetch
                onClick={() =>
                  handleNavigation(
                    '/company',
                  )
                }
                className="
                  flex
                  items-center
                  gap-2.5
                  rounded-xl
                  px-1.5
                  py-1.5
                  transition-colors
                  duration-150
                  hover:bg-[#f7fafc]
                "
              >
                <div
                  className="
                    hidden
                    max-w-[170px]
                    text-right
                    sm:block
                  "
                >
                  <div
                    className="
                      truncate
                      text-[12px]
                      font-bold
                      leading-5
                      text-[#101b3d]
                    "
                  >
                    {companyName}
                  </div>

                  <div
                    className="
                      truncate
                      text-[10px]
                      text-[#8290aa]
                    "
                  >
                    {companyNif}
                  </div>
                </div>

                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-md
                    bg-[#0b6f93]
                    text-[11px]
                    font-bold
                    text-white
                  "
                >
                  {initials}
                </div>

              </Link>
            </div>
          </div>
        </header>

        {/* =================================================
            CONTEÚDO
        ================================================= */}

        <main
          className="
            fd-main
            min-h-[calc(100vh-68px)]
            px-4
            py-5
            sm:px-6
            lg:px-7
            lg:py-6
          "
        >
          <div
            key={pathname}
            className="
              dashboard-page-content
            "
          >
            {children}
          </div>
        </main>
      </div>

      <style jsx global>{`
        @keyframes dashboard-page-enter {
          from { opacity: 0; transform: translate3d(0, 6px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }

        .dashboard-page-content {
          animation: dashboard-page-enter 160ms ease-out both;
          contain: layout;
        }

        ::view-transition-old(root) {
          animation: dashboard-view-out 160ms ease-out both;
        }

        ::view-transition-new(root) {
          animation: dashboard-view-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes dashboard-view-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes dashboard-view-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-page-content,
          ::view-transition-old(root),
          ::view-transition-new(root) {
            animation: none;
          }
        }
      `}</style>

    </div>
  );
}
