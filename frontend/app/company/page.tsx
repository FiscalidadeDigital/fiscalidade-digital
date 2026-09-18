'use client';

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';

import {
  Building2,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Edit3,
  Fingerprint,
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';

import api from '@/services/api';

import {
  addEmployeeSalary,
  createEmployee,
  deleteEmployee,
  getEmployees,
  type CreateEmployeeData,
  type Employee,
} from '@/services/employee';

import { getCompany } from '@/services/company';

/* =========================================================
   TIPOS
========================================================= */

type Company = {
  id?: string;
  name?: string | null;
  nif?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  sector?: string | null;
  companyType?: string | null;
  employeeCount?: number | null;
  regime?: string | null;
  retentionRate?: number | null;
  status?: string | null;
};

type CompanyFormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  sector: string;
  companyType: string;
};

type FormState = {
  name: string;
  employeeNumber: string;
  nif: string;
  socialSecurityNumber: string;

  email: string;
  phone: string;
  address: string;

  birthDate: string;
  hireDate: string;

  jobTitle: string;
  department: string;

  gender: string;
  maritalStatus: string;
  status: string;

  dependentCount: string;

  baseSalary: string;
  foodAllowance: string;
  transportAllowance: string;
  otherAllowances: string;

  bonuses: string;
  commissions: string;
  otherIncome: string;

  effectiveFrom: string;
  notes: string;
};

const initialForm: FormState = {
  name: '',
  employeeNumber: '',
  nif: '',
  socialSecurityNumber: '',

  email: '',
  phone: '',
  address: '',

  birthDate: '',
  hireDate: '',

  jobTitle: '',
  department: '',

  gender: '',
  maritalStatus: '',
  status: 'ACTIVE',

  dependentCount: '0',

  baseSalary: '',
  foodAllowance: '0',
  transportAllowance: '0',
  otherAllowances: '0',

  bonuses: '0',
  commissions: '0',
  otherIncome: '0',

  effectiveFrom: '',
  notes: '',
};

/* =========================================================
   HELPERS
========================================================= */

function money(value: unknown) {
  const number = Number(value || 0);

  return new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function getErrorMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Ocorreu um erro inesperado.'
  );
}

function today() {
  return new Date().toISOString().split('T')[0];
}

/* =========================================================
   PÁGINA
========================================================= */

export default function CompanyPage() {
  const [company, setCompany] =
    useState<Company | null>(null);

  const [showCompanyModal, setShowCompanyModal] =
    useState(false);

  const [savingCompany, setSavingCompany] =
    useState(false);

  const [companyForm, setCompanyForm] =
    useState<CompanyFormState>({
      name: '',
      email: '',
      phone: '',
      address: '',
      sector: '',
      companyType: '',
    });

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [loadingCompany, setLoadingCompany] =
    useState(true);

  const [loadingEmployees, setLoadingEmployees] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [showEmployeeModal, setShowEmployeeModal] =
    useState(false);

  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [menuEmployee, setMenuEmployee] =
    useState<string | null>(null);

  /* =======================================================
     CARREGAR EMPRESA
  ======================================================= */

  async function loadCompany() {
    try {
      setLoadingCompany(true);

      const response = await getCompany();

      setCompany(response);
    } catch (err) {
      console.error(
        'Erro ao carregar empresa:',
        err,
      );

      try {
        const response =
          await api.get('/company');

        setCompany(
          response?.data?.data ??
            response?.data ??
            null,
        );
      } catch (fallbackError) {
        console.error(
          'Erro no fallback da empresa:',
          fallbackError,
        );

        setError(
          'Não foi possível carregar os dados da empresa autenticada.',
        );
      }
    } finally {
      setLoadingCompany(false);
    }
  }

  /* =======================================================
     EDITAR EMPRESA
  ======================================================= */

  function openEditCompany() {
    setError('');
    setSuccess('');

    setCompanyForm({
      name: company?.name || '',
      email: company?.email || '',
      phone: company?.phone || '',
      address: company?.address || '',
      sector: company?.sector || '',
      companyType: company?.companyType || '',
    });

    setShowCompanyModal(true);
  }

  function updateCompanyForm(
    field: keyof CompanyFormState,
    value: string,
  ) {
    setCompanyForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function closeCompanyModal() {
    if (!savingCompany) {
      setShowCompanyModal(false);
    }
  }

  async function handleCompanySubmit(event: FormEvent) {
    event.preventDefault();

    if (!companyForm.name.trim()) {
      setError('O nome da empresa é obrigatório.');
      return;
    }

    try {
      setSavingCompany(true);
      setError('');
      setSuccess('');

      const payload = {
        name: companyForm.name.trim(),
        email: companyForm.email.trim() || undefined,
        phone: companyForm.phone.trim() || undefined,
        address: companyForm.address.trim() || undefined,
        sector: companyForm.sector.trim() || undefined,
        companyType: companyForm.companyType.trim() || undefined,
      };

      const response = await api.patch('/company', payload);

      const updatedCompany =
        response?.data?.data ??
        response?.data ??
        null;

      if (updatedCompany) {
        setCompany((current) => ({
          ...(current || {}),
          ...updatedCompany,
        }));
      } else {
        await loadCompany();
      }

      setShowCompanyModal(false);
      setSuccess('Dados da empresa actualizados com sucesso.');
    } catch (err) {
      console.error('Erro ao actualizar empresa:', err);
      setError(getErrorMessage(err));
    } finally {
      setSavingCompany(false);
    }
  }

  /* =======================================================
     CARREGAR FUNCIONÁRIOS
  ======================================================= */

  async function loadEmployees() {
    try {
      setLoadingEmployees(true);

      const response =
        await getEmployees();

      setEmployees(
        Array.isArray(response)
          ? response
          : [],
      );
    } catch (err) {
      console.error(
        'Erro ao carregar funcionários:',
        err,
      );

      setError(
        getErrorMessage(err),
      );
    } finally {
      setLoadingEmployees(false);
    }
  }

  /* =======================================================
     INICIALIZAÇÃO
  ======================================================= */

  useEffect(() => {
    void loadCompany();
    void loadEmployees();
  }, []);

  /* =======================================================
     ESTATÍSTICAS
  ======================================================= */

  const activeEmployees =
    useMemo(() => {
      return employees.filter(
        (employee: any) =>
          employee?.status ===
          'ACTIVE',
      ).length;
    }, [employees]);

  const inactiveEmployees =
    useMemo(() => {
      return (
        employees.length -
        activeEmployees
      );
    }, [
      employees.length,
      activeEmployees,
    ]);

  const totalPayroll =
    useMemo(() => {
      return employees.reduce(
        (
          total: number,
          employee: any,
        ) => {
          const salary =
            employee?.salaries?.[0]
              ?.baseSalary ?? 0;

          return (
            total +
            Number(salary || 0)
          );
        },
        0,
      );
    }, [employees]);

  /* =======================================================
     PESQUISA
  ======================================================= */

  const filteredEmployees =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return employees;
      }

      return employees.filter(
        (employee: any) =>
          employee?.name
            ?.toLowerCase()
            .includes(term) ||
          employee?.nif
            ?.toLowerCase()
            .includes(term) ||
          employee?.employeeNumber
            ?.toLowerCase()
            .includes(term) ||
          employee?.jobTitle
            ?.toLowerCase()
            .includes(term),
      );
    }, [
      employees,
      search,
    ]);

  /* =======================================================
     FORMULÁRIO
  ======================================================= */

  function updateForm(
    field: keyof FormState,
    value: string,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  function resetForm() {
    setForm({
      ...initialForm,
      effectiveFrom: today(),
    });

    setEditingEmployee(null);
  }

  function openCreateEmployee() {
    setError('');
    setSuccess('');

    resetForm();

    setShowEmployeeModal(true);
  }

  function closeEmployeeModal() {
    if (saving) {
      return;
    }

    setShowEmployeeModal(false);

    resetForm();
  }

  /* =======================================================
     EDITAR FUNCIONÁRIO
  ======================================================= */

  function openEditEmployee(
    employee: any,
  ) {
    setError('');
    setSuccess('');

    const salary =
      employee?.salaries?.[0];

    setEditingEmployee(employee);

    setForm({
      name:
        employee?.name || '',

      employeeNumber:
        employee?.employeeNumber ||
        '',

      nif:
        employee?.nif || '',

      socialSecurityNumber:
        employee?.socialSecurityNumber ||
        '',

      email:
        employee?.email || '',

      phone:
        employee?.phone || '',

      address:
        employee?.address || '',

      birthDate:
        employee?.birthDate
          ? String(
              employee.birthDate,
            ).slice(0, 10)
          : '',

      hireDate:
        employee?.hireDate
          ? String(
              employee.hireDate,
            ).slice(0, 10)
          : '',

      jobTitle:
        employee?.jobTitle || '',

      department:
        employee?.department || '',

      gender:
        employee?.gender || '',

      maritalStatus:
        employee?.maritalStatus ||
        '',

      status:
        employee?.status ||
        'ACTIVE',

      dependentCount:
        String(
          employee?.dependentCount ??
            0,
        ),

      baseSalary:
        salary?.baseSalary != null
          ? String(
              salary.baseSalary,
            )
          : '',

      foodAllowance:
        salary?.foodAllowance != null
          ? String(
              salary.foodAllowance,
            )
          : '0',

      transportAllowance:
        salary?.transportAllowance != null
          ? String(
              salary.transportAllowance,
            )
          : '0',

      otherAllowances:
        salary?.otherAllowances != null
          ? String(
              salary.otherAllowances,
            )
          : '0',

      bonuses:
        salary?.bonuses != null
          ? String(
              salary.bonuses,
            )
          : '0',

      commissions:
        salary?.commissions != null
          ? String(
              salary.commissions,
            )
          : '0',

      otherIncome:
        salary?.otherIncome != null
          ? String(
              salary.otherIncome,
            )
          : '0',

      effectiveFrom:
        salary?.effectiveFrom
          ? String(
              salary.effectiveFrom,
            ).slice(0, 10)
          : today(),

      notes:
        employee?.notes || '',
    });

    setShowEmployeeModal(true);
  }

  /* =======================================================
     GUARDAR FUNCIONÁRIO
  ======================================================= */

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError(
        'O nome completo do funcionário é obrigatório.',
      );

      return;
    }

    if (!form.baseSalary.trim()) {
      setError(
        'Informe o salário base do funcionário.',
      );

      return;
    }

    try {
      setSaving(true);

      const employeeData:
        CreateEmployeeData = {
        name:
          form.name.trim(),

        nif:
          form.nif.trim() ||
          undefined,

        socialSecurityNumber:
          form.socialSecurityNumber.trim() ||
          undefined,

        email:
          form.email.trim() ||
          undefined,

        phone:
          form.phone.trim() ||
          undefined,

        address:
          form.address.trim() ||
          undefined,

        birthDate:
          form.birthDate ||
          undefined,

        hireDate:
          form.hireDate ||
          undefined,

        jobTitle:
          form.jobTitle.trim() ||
          undefined,

        department:
          form.department.trim() ||
          undefined,

        maritalStatus:
          form.maritalStatus ||
          undefined,

        dependentCount:
          Number(
            form.dependentCount ||
              0,
          ),

        notes:
          form.notes.trim() ||
          undefined,
      };

      let employeeId =
        editingEmployee?.id;

      /* ===================================================
         CRIAR
      =================================================== */

      if (!editingEmployee) {
        const response =
          await createEmployee(
            employeeData,
          );

        employeeId =
          response?.id;

        if (!employeeId) {
          throw new Error(
            'Funcionário criado, mas a API não devolveu o ID.',
          );
        }
      } else {
        await api.patch(
          `/employees/${editingEmployee.id}`,
          employeeData,
        );
      }

      /* ===================================================
         SALÁRIO
      =================================================== */

      if (employeeId) {
        await addEmployeeSalary(
          employeeId,
          {
            baseSalary:
              Number(
                form.baseSalary ||
                  0,
              ),

            foodAllowance:
              Number(
                form.foodAllowance ||
                  0,
              ),

            transportAllowance:
              Number(
                form.transportAllowance ||
                  0,
              ),

            otherAllowances:
              Number(
                form.otherAllowances ||
                  0,
              ),

            bonuses:
              Number(
                form.bonuses ||
                  0,
              ),

            commissions:
              Number(
                form.commissions ||
                  0,
              ),

            otherIncome:
              Number(
                form.otherIncome ||
                  0,
              ),

            effectiveFrom:
              form.effectiveFrom ||
              today(),

            notes:
              form.notes.trim() ||
              undefined,
          } as any,
        );
      }

      setSuccess(
        editingEmployee
          ? 'Funcionário atualizado com sucesso.'
          : 'Funcionário registado com sucesso.',
      );

      setShowEmployeeModal(false);

      resetForm();

      await Promise.all([
        loadEmployees(),
        loadCompany(),
      ]);
    } catch (err) {
      console.error(
        'Erro ao guardar funcionário:',
        err,
      );

      setError(
        getErrorMessage(err),
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     ELIMINAR
  ======================================================= */

  async function handleDelete(
    employee: Employee,
  ) {
    const confirmed =
      window.confirm(
        `Tem certeza que deseja eliminar ${employee.name}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await deleteEmployee(
        employee.id,
      );

      setMenuEmployee(null);

      setSuccess(
        'Funcionário eliminado com sucesso.',
      );

      await Promise.all([
        loadEmployees(),
        loadCompany(),
      ]);
    } catch (err) {
      console.error(
        'Erro ao eliminar funcionário:',
        err,
      );

      setError(
        getErrorMessage(err),
      );
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f5f8fc] text-[#101b3d]">

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

          {/* CABEÇALHO SIMPLES */}

          <header className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#079fe5]">
                  Gestão empresarial
                </p>

                <h1 className="text-2xl font-black tracking-tight text-[#101b3d] sm:text-3xl">
                  {loadingCompany
                    ? 'A carregar empresa...'
                    : company?.name || 'Minha empresa'}
                </h1>

                <p className="mt-1 text-sm text-[#748198]">
                  Gere os dados da empresa e os seus colaboradores.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateEmployee}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0877e8] px-5 text-sm font-black text-white shadow-lg shadow-[#0877e8]/20 transition hover:bg-[#066bd1]"
              >
                <Plus size={17} />
                Novo funcionário
              </button>
            </div>
          </header>

          {/* =================================================
              MENSAGEM DE ERRO
          ================================================= */}

          {error && (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">

              <div className="flex gap-3">

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 font-black">
                  !
                </div>

                <div>

                  <p className="font-black">
                    Não foi possível
                    concluir a operação
                  </p>

                  <p className="mt-0.5">
                    {error}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setError('')
                }
                className="rounded-lg p-1 hover:bg-red-100"
              >
                <X size={18} />
              </button>

            </div>
          )}

          {/* =================================================
              MENSAGEM DE SUCESSO
          ================================================= */}

          {success && (
            <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-700">

              <div className="flex items-center gap-3">

                <CheckCircle2 size={19} />

                <span className="font-bold">
                  {success}
                </span>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSuccess('')
                }
                className="rounded-lg p-1 hover:bg-emerald-100"
              >
                <X size={18} />
              </button>

            </div>
          )}

          {/* =================================================
              HERO DA EMPRESA
          ================================================= */}

          <section className="relative mb-6 overflow-hidden rounded-[28px] bg-[#101b3d] shadow-xl shadow-[#101b3d]/10">

            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#079fe5]/20 blur-3xl" />

            <div className="absolute -bottom-36 left-1/3 h-80 w-80 rounded-full bg-[#5940d7]/20 blur-3xl" />

            <div className="absolute right-[30%] top-8 h-24 w-24 rounded-full border border-white/10" />

            <div className="relative p-6 sm:p-8 lg:p-9">

              <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">

                <div className="flex min-w-0 items-start gap-5">

                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#079fe5] to-[#5940d7] shadow-lg shadow-[#079fe5]/20">

                    <Building2
                      size={31}
                      strokeWidth={1.7}
                      className="text-white"
                    />

                  </div>

                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-3">

                      <h2 className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
                        {company?.name ||
                          'Minha empresa'}
                      </h2>

                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-black text-emerald-300">

                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />

                        {company?.status ===
                        'ACTIVE'
                          ? 'Activa'
                          : company?.status ||
                            'Activa'}

                      </span>

                    </div>

                    <p className="mt-2 text-sm text-[#aebbd0]">
                      Perfil empresarial e
                      enquadramento fiscal
                    </p>

                    <div className="mt-5 grid gap-2 sm:grid-cols-3">

                      <IdentityItem
                        label="NIF"
                        value={
                          company?.nif ||
                          '—'
                        }
                      />

                      <IdentityItem
                        label="Regime"
                        value={
                          company?.regime ||
                          'GERAL'
                        }
                      />

                      <IdentityItem
                        label="Sector"
                        value={
                          company?.sector ||
                          'Empresa'
                        }
                      />

                    </div>

                  </div>

                </div>

                <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">

                  <button
                    type="button"
                    onClick={openEditCompany}
                    disabled={loadingCompany || !company}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#0877e8] transition hover:bg-[#f4f9fd] disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    <Edit3 size={16} />

                    Editar empresa

                  </button>

                  <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-[#aebbd0]">

                    <Fingerprint
                      size={15}
                    />

                    Dados fiscais protegidos

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              KPIS
          ================================================= */}

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <KpiCard
              icon={
                <Users size={21} />
              }
              label="Funcionários"
              value={
                loadingEmployees
                  ? '...'
                  : String(
                      employees.length,
                    )
              }
              description="Total registado"
              iconClass="bg-[#e9f7fd] text-[#079fe5]"
            />

            <KpiCard
              icon={
                <CheckCircle2
                  size={21}
                />
              }
              label="Activos"
              value={
                loadingEmployees
                  ? '...'
                  : String(
                      activeEmployees,
                    )
              }
              description={`${inactiveEmployees} inactivo(s)`}
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <KpiCard
              icon={
                <WalletCards
                  size={21}
                />
              }
              label="Massa salarial"
              value={
                loadingEmployees
                  ? '...'
                  : `${money(
                      totalPayroll,
                    )} Kz`
              }
              description="Salários base actuais"
              iconClass="bg-[#efedff] text-[#5940d7]"
            />

            <KpiCard
              icon={
                <ShieldCheck
                  size={21}
                />
              }
              label="Regime fiscal"
              value={
                company?.regime ||
                'GERAL'
              }
              description="Enquadramento actual"
              iconClass="bg-[#fff0f8] text-[#9e4f95]"
            />

          </section>

          {/* =================================================
              CONTEÚDO PRINCIPAL
          ================================================= */}

          <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">

            {/* =================================================
                PERFIL EMPRESA
            ================================================= */}

            <div className="rounded-[26px] border border-[#dfe7f1] bg-white shadow-sm">

              <div className="border-b border-[#edf1f6] p-6">

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f7fd] text-[#079fe5]">

                    <Building2
                      size={19}
                    />

                  </div>

                  <div>

                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#079fe5]">
                      Perfil empresarial
                    </p>

                    <h2 className="mt-1 text-lg font-black text-[#101b3d]">
                      Dados da empresa
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-[#748198]">
                      Informação associada
                      à empresa
                      autenticada.
                    </p>

                  </div>

                </div>

              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-1">

                <CompanyInfo
                  icon={
                    <Building2
                      size={16}
                    />
                  }
                  label="Empresa"
                  value={
                    company?.name ||
                    '—'
                  }
                />

                <CompanyInfo
                  icon={
                    <Fingerprint
                      size={16}
                    />
                  }
                  label="NIF"
                  value={
                    company?.nif ||
                    '—'
                  }
                />

                <CompanyInfo
                  icon={
                    <Mail size={16} />
                  }
                  label="Email"
                  value={
                    company?.email ||
                    '—'
                  }
                />

                <CompanyInfo
                  icon={
                    <Phone size={16} />
                  }
                  label="Telefone"
                  value={
                    company?.phone ||
                    '—'
                  }
                />

                <CompanyInfo
                  icon={
                    <MapPin
                      size={16}
                    />
                  }
                  label="Morada"
                  value={
                    company?.address ||
                    '—'
                  }
                />

                <CompanyInfo
                  icon={
                    <Briefcase
                      size={16}
                    />
                  }
                  label="Sector"
                  value={
                    company?.sector ||
                    '—'
                  }
                />

              </div>

              <div className="m-5 rounded-2xl border border-[#d9edf8] bg-[#f5fbfe] p-4">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#079fe5] shadow-sm">

                    <ShieldCheck
                      size={17}
                    />

                  </div>

                  <div>

                    <p className="text-sm font-black text-[#101b3d]">
                      Centro fiscal
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#68768d]">
                      Os dados da
                      empresa podem
                      alimentar a gestão
                      salarial, IRT e
                      Segurança Social.
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                EQUIPA
            ================================================= */}

            <div className="overflow-hidden rounded-[26px] border border-[#dfe7f1] bg-white shadow-sm">

              <div className="border-b border-[#edf1f6] p-6">

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#efedff] text-[#5940d7]">

                      <Users size={20} />

                    </div>

                    <div>

                      <div className="flex items-center gap-2">

                        <h2 className="text-xl font-black text-[#101b3d]">
                          Equipa
                        </h2>

                        <span className="rounded-full bg-[#eef7fc] px-2.5 py-1 text-[10px] font-black text-[#0877e8]">
                          {
                            employees.length
                          }
                        </span>

                      </div>

                      <p className="mt-0.5 text-xs text-[#748198] sm:text-sm">
                        Funcionários,
                        salários e
                        informação fiscal.
                      </p>

                    </div>

                  </div>

                  <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:w-auto">

                    <div className="relative min-w-0 sm:min-w-[260px]">

                      <Search
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b98aa]"
                      />

                      <input
                        value={search}
                        onChange={(
                          event,
                        ) =>
                          setSearch(
                            event.target
                              .value,
                          )
                        }
                        placeholder="Pesquisar funcionário..."
                        className="h-11 w-full rounded-xl border border-[#dfe7f1] bg-[#f8fafc] pl-10 pr-4 text-sm font-medium text-[#101b3d] outline-none transition placeholder:text-[#9aa6b7] focus:border-[#5cbce8] focus:bg-white focus:ring-4 focus:ring-[#079fe5]/10"
                      />

                    </div>

                    <button
                      type="button"
                      onClick={
                        openCreateEmployee
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#079fe5] px-4 text-sm font-black text-white transition hover:bg-[#058dc9]"
                    >

                      <Plus size={17} />

                      Adicionar

                    </button>

                  </div>

                </div>

              </div>

              {/* =================================================
                  CARREGAMENTO
              ================================================= */}

              {loadingEmployees ? (
                <div className="flex min-h-[340px] items-center justify-center">

                  <div className="flex flex-col items-center gap-3 text-center">

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef7fc]">

                      <Loader2
                        size={22}
                        className="animate-spin text-[#079fe5]"
                      />

                    </div>

                    <div>

                      <p className="text-sm font-black text-[#101b3d]">
                        A carregar equipa
                      </p>

                      <p className="mt-1 text-xs text-[#7c899d]">
                        Estamos a actualizar
                        os dados.
                      </p>

                    </div>

                  </div>

                </div>
              ) : filteredEmployees.length === 0 ? (

                /* =================================================
                   EMPTY STATE
                ================================================= */

                <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">

                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f2f5f9] text-[#8492a6]">

                    <UserRound
                      size={29}
                    />

                  </div>

                  <h3 className="text-lg font-black text-[#101b3d]">
                    {search
                      ? 'Nenhum funcionário encontrado'
                      : 'A equipa ainda está vazia'}
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-[#748198]">
                    {search
                      ? 'Tente pesquisar pelo nome, NIF, número ou cargo.'
                      : 'Adicione o primeiro funcionário para começar a gerir salários, IRT e Segurança Social.'}
                  </p>

                  {!search && (
                    <button
                      type="button"
                      onClick={
                        openCreateEmployee
                      }
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#101b3d] px-5 py-3 text-sm font-black text-white transition hover:bg-[#18284b]"
                    >

                      <Plus size={17} />

                      Adicionar funcionário

                    </button>
                  )}

                </div>

              ) : (

                /* =================================================
                   LISTA DE FUNCIONÁRIOS
                ================================================= */

                <div className="divide-y divide-[#edf1f6]">

                  {filteredEmployees.map(
                    (
                      employee: any,
                    ) => {

                      const salary =
                        employee
                          ?.salaries?.[0];

                      const isActive =
                        employee?.status ===
                        'ACTIVE';

                      return (
                        <div
                          key={
                            employee.id
                          }
                          className="group px-5 py-5 transition hover:bg-[#f9fbfd] sm:px-6"
                        >

                          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                            <div className="flex min-w-0 items-center gap-4">

                              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e8f7fd] to-[#efedff] text-sm font-black text-[#0877e8] ring-1 ring-[#dceaf5]">

                                {employee
                                  ?.name
                                  ?.charAt(
                                    0,
                                  )
                                  ?.toUpperCase() ||
                                  '?'}

                              </div>

                              <div className="min-w-0">

                                <div className="flex flex-wrap items-center gap-2">

                                  <h3 className="truncate text-sm font-black text-[#101b3d]">
                                    {
                                      employee.name
                                    }
                                  </h3>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                                      isActive
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {isActive
                                      ? 'Activo'
                                      : employee.status ||
                                        'Inactivo'}
                                  </span>

                                </div>

                                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#7a879a]">

                                  <span className="font-semibold">
                                    Nº{' '}
                                    {employee.employeeNumber ||
                                      '—'}
                                  </span>

                                  <span>
                                    NIF:{' '}
                                    {employee.nif ||
                                      '—'}
                                  </span>

                                  <span>
                                    {employee.jobTitle ||
                                      'Sem cargo definido'}
                                  </span>

                                </div>

                              </div>

                            </div>

                            <div className="flex items-center justify-between gap-5 lg:justify-end">

                              <div className="text-left lg:text-right">

                                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8b98aa]">
                                  Salário base
                                </p>

                                <p className="mt-1 text-sm font-black text-[#101b3d]">
                                  {money(
                                    salary?.baseSalary ||
                                      0,
                                  )}{' '}
                                  Kz
                                </p>

                              </div>

                              <div className="relative">

                                <button
                                  type="button"
                                  onClick={() =>
                                    setMenuEmployee(
                                      menuEmployee ===
                                        employee.id
                                        ? null
                                        : employee.id,
                                    )
                                  }
                                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe7f1] text-[#738198] transition hover:border-[#bcd8e8] hover:bg-[#eef8fc] hover:text-[#0877e8]"
                                  aria-label="Mais opções"
                                >

                                  <MoreHorizontal
                                    size={18}
                                  />

                                </button>

                                {menuEmployee ===
                                  employee.id && (
                                  <div className="absolute right-0 top-12 z-30 w-44 overflow-hidden rounded-2xl border border-[#dfe7f1] bg-white p-1.5 shadow-2xl">

                                    <button
                                      type="button"
                                      onClick={() => {
                                        openEditEmployee(
                                          employee,
                                        );

                                        setMenuEmployee(
                                          null,
                                        );
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[#34435c] transition hover:bg-[#f2f8fc] hover:text-[#0877e8]"
                                    >

                                      <Edit3
                                        size={15}
                                      />

                                      Editar

                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDelete(
                                          employee,
                                        )
                                      }
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                                    >

                                      <Trash2
                                        size={15}
                                      />

                                      Eliminar

                                    </button>

                                  </div>
                                )}

                              </div>

                            </div>

                          </div>

                        </div>
                      );
                    },
                  )}

                </div>
              )}

              <div className="border-t border-[#edf1f6] bg-[#fafbfd] px-5 py-3.5 sm:px-6">

                <div className="flex flex-wrap items-center justify-between gap-2">

                  <p className="text-xs font-semibold text-[#7b889b]">
                    {
                      filteredEmployees.length
                    }{' '}
                    funcionário(s)
                    apresentado(s)
                  </p>

                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9aa6b7]">
                    Fiscalidade Digital
                  </p>

                </div>

              </div>

            </div>

          </section>

        </main>

        {/* =====================================================
            MODAL
        ===================================================== */}

        {/* MODAL DE EDIÇÃO DA EMPRESA */}

        {showCompanyModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#101b3d]/65 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#e5ebf2] px-5 py-5 sm:px-7">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#079fe5]">
                    Perfil empresarial
                  </p>
                  <h2 className="mt-1 text-xl font-black text-[#101b3d]">
                    Editar empresa
                  </h2>
                  <p className="mt-1 text-sm text-[#748198]">
                    Actualize os dados gerais da empresa.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCompanyModal}
                  disabled={savingCompany}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[#8a96a8] transition hover:bg-[#f1f4f8]"
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCompanySubmit}>
                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
                  <Field label="Nome da empresa" required>
                    <input
                      value={companyForm.name}
                      onChange={(event) =>
                        updateCompanyForm('name', event.target.value)
                      }
                      required
                      className="input-field"
                      placeholder="Nome da empresa"
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      type="email"
                      value={companyForm.email}
                      onChange={(event) =>
                        updateCompanyForm('email', event.target.value)
                      }
                      className="input-field"
                      placeholder="empresa@email.com"
                    />
                  </Field>

                  <Field label="Telefone">
                    <input
                      value={companyForm.phone}
                      onChange={(event) =>
                        updateCompanyForm('phone', event.target.value)
                      }
                      className="input-field"
                      placeholder="+244 9xx xxx xxx"
                    />
                  </Field>

                  <Field label="Sector">
                    <input
                      value={companyForm.sector}
                      onChange={(event) =>
                        updateCompanyForm('sector', event.target.value)
                      }
                      className="input-field"
                      placeholder="Sector de actividade"
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Tipo de empresa">
                      <input
                        value={companyForm.companyType}
                        onChange={(event) =>
                          updateCompanyForm('companyType', event.target.value)
                        }
                        className="input-field"
                        placeholder="Tipo de empresa"
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Morada">
                      <textarea
                        value={companyForm.address}
                        onChange={(event) =>
                          updateCompanyForm('address', event.target.value)
                        }
                        rows={3}
                        className="input-field h-auto resize-none py-3"
                        placeholder="Morada da empresa"
                      />
                    </Field>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-[#e5ebf2] bg-[#fbfcfe] px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                  <button
                    type="button"
                    onClick={closeCompanyModal}
                    disabled={savingCompany}
                    className="h-11 rounded-xl border border-[#dfe7f1] px-5 text-sm font-black text-[#53627a] hover:bg-white disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={savingCompany}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0877e8] px-6 text-sm font-black text-white hover:bg-[#066bd1] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingCompany ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        A guardar...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={17} />
                        Guardar alterações
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEmployeeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101b3d]/65 p-3 backdrop-blur-sm sm:p-5">

            <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-[#f7f9fc] shadow-2xl">

              {/* =================================================
                  MODAL HEADER
              ================================================= */}

              <div className="border-b border-[#e5ebf2] bg-white px-5 py-5 sm:px-7">

                <div className="flex items-center justify-between gap-4">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e9f7fd] text-[#079fe5]">

                      <UserRound
                        size={20}
                      />

                    </div>

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h2 className="truncate text-lg font-black text-[#101b3d] sm:text-xl">
                          {editingEmployee
                            ? 'Editar funcionário'
                            : 'Novo funcionário'}
                        </h2>

                        <span className="rounded-full bg-[#eef7fc] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#0877e8]">
                          Dados fiscais
                        </span>

                      </div>

                      <p className="mt-0.5 text-xs text-[#748198] sm:text-sm">
                        Dados pessoais,
                        profissionais e
                        remuneração.
                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={
                      closeEmployeeModal
                    }
                    disabled={saving}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#8a96a8] transition hover:bg-[#f1f4f8] hover:text-[#101b3d]"
                    aria-label="Fechar"
                  >

                    <X size={20} />

                  </button>

                </div>

              </div>

              {/* =================================================
                  FORM
              ================================================= */}

              <form
                onSubmit={
                  handleSubmit
                }
                className="overflow-y-auto"
              >

                <div className="space-y-4 p-4 sm:p-6 md:p-7">

                  {/* IDENTIFICAÇÃO */}

                  <FormSection
                    icon={
                      <Fingerprint
                        size={17}
                      />
                    }
                    title="Identificação"
                    description="Dados pessoais e identificação fiscal."
                  >

                    <div className="grid gap-4 md:grid-cols-2">

                      <Field
                        label="Nome completo"
                        required
                      >

                        <input
                          value={
                            form.name
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'name',
                              event.target
                                .value,
                            )
                          }
                          placeholder="Ex.: Edgar Da Silva"
                          required
                          className="input-field"
                        />

                      </Field>

                      <Field label="Número do funcionário">

                        <input
                          value={
                            form.employeeNumber
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'employeeNumber',
                              event.target
                                .value,
                            )
                          }
                          placeholder="Ex.: 001"
                          className="input-field"
                        />

                      </Field>

                      <Field label="NIF">

                        <input
                          value={
                            form.nif
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'nif',
                              event.target
                                .value,
                            )
                          }
                          placeholder="Número de identificação fiscal"
                          className="input-field"
                        />

                      </Field>

                      <Field label="N.º Segurança Social">

                        <input
                          value={
                            form.socialSecurityNumber
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'socialSecurityNumber',
                              event.target
                                .value,
                            )
                          }
                          placeholder="Número da Segurança Social"
                          className="input-field"
                        />

                      </Field>

                      <Field label="Género">

                        <SelectField
                          value={
                            form.gender
                          }
                          onChange={(
                            value,
                          ) =>
                            updateForm(
                              'gender',
                              value,
                            )
                          }
                          placeholder="Seleccione o género"
                          options={[
                            [
                              'MASCULINO',
                              'Masculino',
                            ],
                            [
                              'FEMININO',
                              'Feminino',
                            ],
                            [
                              'OUTRO',
                              'Outro',
                            ],
                          ]}
                        />

                      </Field>

                      <Field label="Estado civil">

                        <SelectField
                          value={
                            form.maritalStatus
                          }
                          onChange={(
                            value,
                          ) =>
                            updateForm(
                              'maritalStatus',
                              value,
                            )
                          }
                          placeholder="Seleccione o estado civil"
                          options={[
                            [
                              'SOLTEIRO',
                              'Solteiro(a)',
                            ],
                            [
                              'CASADO',
                              'Casado(a)',
                            ],
                            [
                              'DIVORCIADO',
                              'Divorciado(a)',
                            ],
                            [
                              'VIUVO',
                              'Viúvo(a)',
                            ],
                            [
                              'UNIAO_DE_FACTO',
                              'União de facto',
                            ],
                          ]}
                        />

                      </Field>

                      <Field label="Data de nascimento">

                        <input
                          type="date"
                          value={
                            form.birthDate
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'birthDate',
                              event.target
                                .value,
                            )
                          }
                          className="input-field"
                        />

                      </Field>

                      <Field label="Data de admissão">

                        <input
                          type="date"
                          value={
                            form.hireDate
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'hireDate',
                              event.target
                                .value,
                            )
                          }
                          className="input-field"
                        />

                      </Field>

                    </div>

                  </FormSection>

                  {/* CONTACTOS */}

                  <FormSection
                    icon={
                      <Phone size={17} />
                    }
                    title="Contactos"
                    description="Informações de contacto do funcionário."
                  >

                    <div className="grid gap-4 md:grid-cols-2">

                      <Field label="Email">

                        <input
                          type="email"
                          value={
                            form.email
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'email',
                              event.target
                                .value,
                            )
                          }
                          placeholder="funcionario@email.com"
                          className="input-field"
                        />

                      </Field>

                      <Field label="Telefone">

                        <input
                          value={
                            form.phone
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'phone',
                              event.target
                                .value,
                            )
                          }
                          placeholder="+244 9xx xxx xxx"
                          className="input-field"
                        />

                      </Field>

                      <div className="md:col-span-2">

                        <Field label="Morada">

                          <input
                            value={
                              form.address
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                'address',
                                event.target
                                  .value,
                              )
                            }
                            placeholder="Morada do funcionário"
                            className="input-field"
                          />

                        </Field>

                      </div>

                    </div>

                  </FormSection>

                  {/* PROFISSIONAL */}

                  <FormSection
                    icon={
                      <Briefcase
                        size={17}
                      />
                    }
                    title="Dados profissionais"
                    description="Função, departamento e situação laboral."
                  >

                    <div className="grid gap-4 md:grid-cols-2">

                      <Field label="Cargo">

                        <input
                          value={
                            form.jobTitle
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'jobTitle',
                              event.target
                                .value,
                            )
                          }
                          placeholder="Ex.: Técnico Administrativo"
                          className="input-field"
                        />

                      </Field>

                      <Field label="Departamento">

                        <input
                          value={
                            form.department
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'department',
                              event.target
                                .value,
                            )
                          }
                          placeholder="Ex.: Administração"
                          className="input-field"
                        />

                      </Field>

                      <Field label="Estado">

                        <SelectField
                          value={
                            form.status
                          }
                          onChange={(
                            value,
                          ) =>
                            updateForm(
                              'status',
                              value,
                            )
                          }
                          options={[
                            [
                              'ACTIVE',
                              'Activo',
                            ],
                            [
                              'INACTIVE',
                              'Inactivo',
                            ],
                            [
                              'SUSPENDED',
                              'Suspenso',
                            ],
                            [
                              'TERMINATED',
                              'Terminado',
                            ],
                          ]}
                        />

                      </Field>

                      <Field label="Dependentes">

                        <input
                          type="number"
                          min="0"
                          value={
                            form.dependentCount
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'dependentCount',
                              event.target
                                .value,
                            )
                          }
                          className="input-field"
                        />

                      </Field>

                    </div>

                  </FormSection>

                  {/* REMUNERAÇÃO */}

                  <FormSection
                    icon={
                      <CircleDollarSign
                        size={17}
                      />
                    }
                    title="Remuneração"
                    description="Valores utilizados na gestão salarial e fiscal."
                  >

                    <div className="grid gap-4 md:grid-cols-2">

                      <Field
                        label="Salário base"
                        required
                      >

                        <div className="relative">

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              form.baseSalary
                            }
                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                'baseSalary',
                                event.target
                                  .value,
                              )
                            }
                            placeholder="0,00"
                            required
                            className="input-field pr-14"
                          />

                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#8b98aa]">
                            Kz
                          </span>

                        </div>

                      </Field>

                      <Field label="Data de início do salário">

                        <input
                          type="date"
                          value={
                            form.effectiveFrom
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'effectiveFrom',
                              event.target
                                .value,
                            )
                          }
                          className="input-field"
                        />

                      </Field>

                      <Field label="Subsídio de alimentação">

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.foodAllowance
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'foodAllowance',
                              event.target
                                .value,
                            )
                          }
                          placeholder="0,00"
                          className="input-field"
                        />

                      </Field>

                      <Field label="Subsídio de transporte">

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.transportAllowance
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'transportAllowance',
                              event.target
                                .value,
                            )
                          }
                          placeholder="0,00"
                          className="input-field"
                        />

                      </Field>

                      <Field label="Outros subsídios">

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.otherAllowances
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'otherAllowances',
                              event.target
                                .value,
                            )
                          }
                          placeholder="0,00"
                          className="input-field"
                        />

                      </Field>

                      <Field label="Bónus">

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.bonuses
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'bonuses',
                              event.target
                                .value,
                            )
                          }
                          placeholder="0,00"
                          className="input-field"
                        />

                      </Field>

                      <Field label="Comissões">

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.commissions
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'commissions',
                              event.target
                                .value,
                            )
                          }
                          placeholder="0,00"
                          className="input-field"
                        />

                      </Field>

                      <Field label="Outros rendimentos">

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.otherIncome
                          }
                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              'otherIncome',
                              event.target
                                .value,
                            )
                          }
                          placeholder="0,00"
                          className="input-field"
                        />

                      </Field>

                    </div>

                  </FormSection>

                  {/* OBSERVAÇÕES */}

                  <FormSection
                    icon={
                      <CalendarDays
                        size={17}
                      />
                    }
                    title="Observações"
                    description="Informação complementar sobre o funcionário."
                  >

                    <textarea
                      value={
                        form.notes
                      }
                      onChange={(
                        event,
                      ) =>
                        updateForm(
                          'notes',
                          event.target
                            .value,
                        )
                      }
                      rows={4}
                      placeholder="Observações sobre o funcionário..."
                      className="input-field h-auto resize-none py-3"
                    />

                  </FormSection>

                </div>

                {/* =================================================
                    FOOTER MODAL
                ================================================= */}

                <div className="sticky bottom-0 flex flex-col-reverse gap-2.5 border-t border-[#e5ebf2] bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">

                  <button
                    type="button"
                    onClick={
                      closeEmployeeModal
                    }
                    disabled={saving}
                    className="h-11 rounded-xl border border-[#dfe7f1] px-5 text-sm font-black text-[#53627a] transition hover:bg-[#f7f9fc] disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0877e8] px-6 text-sm font-black text-white shadow-lg shadow-[#0877e8]/20 transition hover:bg-[#066bd1] disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {saving ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />

                        A guardar...
                      </>
                    ) : (
                      <>
                        <CheckCircle2
                          size={17}
                        />

                        {editingEmployee
                          ? 'Guardar alterações'
                          : 'Registar funcionário'}
                      </>
                    )}

                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

      </div>

      {/* =========================================================
          ESTILOS GLOBAIS
      ========================================================= */}

      <style jsx global>{`
        .input-field {
          width: 100%;
          min-height: 46px;
          border-radius: 12px;
          border: 1px solid #dfe7f1;
          background: #f8fafc;
          padding: 0 13px;
          font-size: 14px;
          font-weight: 500;
          color: #101b3d;
          outline: none;
          transition:
            border-color 0.15s ease,
            background 0.15s ease,
            box-shadow 0.15s ease;
        }

        .input-field::placeholder {
          color: #9aa6b7;
          font-weight: 400;
        }

        .input-field:focus {
          border-color: #5cbce8;
          background: #ffffff;
          box-shadow:
            0 0 0 4px
            rgba(7, 159, 229, 0.10);
        }

        select.input-field {
          cursor: pointer;
        }

        input[type='date'].input-field {
          cursor: pointer;
        }

        input[type='number'].input-field {
          appearance: textfield;
          -moz-appearance: textfield;
        }

        input[type='number'].input-field::-webkit-inner-spin-button,
        input[type='number'].input-field::-webkit-outer-spin-button {
          margin: 0;
          -webkit-appearance: none;
        }

        textarea.input-field {
          padding-top: 12px;
          padding-bottom: 12px;
        }

        @media (max-width: 640px) {
          .input-field {
            min-height: 44px;
            font-size: 13px;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}

/* =========================================================
   IDENTITY ITEM
========================================================= */

function IdentityItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">

      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8291aa]">
        {label}
      </p>

      <p className="mt-0.5 truncate text-xs font-black text-white">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   KPI CARD
========================================================= */

function KpiCard({
  icon,
  label,
  value,
  description,
  iconClass,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
  iconClass: string;
}) {
  return (
    <div className="group rounded-[22px] border border-[#dfe7f1] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between gap-3">

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8b98aa]">
          {label}
        </span>

      </div>

      <p className="mt-5 truncate text-xl font-black tracking-tight text-[#101b3d] sm:text-2xl">
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-[#7a879a]">
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   COMPANY INFO
========================================================= */

function CompanyInfo({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#edf1f6] bg-[#fafbfd] p-4">

      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#8b98aa]">

        <span className="text-[#079fe5]">
          {icon}
        </span>

        {label}

      </div>

      <p className="mt-2 truncate text-sm font-black text-[#101b3d]">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   FORM SECTION
========================================================= */

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-[#e2e8f0] bg-white shadow-sm">

      <div className="border-b border-[#edf1f6] bg-[#fbfcfe] px-5 py-4">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e9f7fd] text-[#079fe5]">
            {icon}
          </div>

          <div>

            <h3 className="text-sm font-black text-[#101b3d]">
              {title}
            </h3>

            <p className="mt-0.5 text-xs text-[#7a879a]">
              {description}
            </p>

          </div>

        </div>

      </div>

      <div className="p-5">
        {children}
      </div>

    </section>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-xs font-black text-[#34435c]">

        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </span>

      {children}

    </label>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (
    value: string,
  ) => void;
  options: [string, string][];
  placeholder?: string;
}) {
  return (
    <div className="relative">

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="input-field appearance-none pr-10"
      >

        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}

        {options.map(
          ([
            optionValue,
            label,
          ]) => (
            <option
              key={
                optionValue
              }
              value={
                optionValue
              }
            >
              {label}
            </option>
          ),
        )}

      </select>

      <ChevronDown
        size={17}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8b98aa]"
      />

    </div>
  );
}