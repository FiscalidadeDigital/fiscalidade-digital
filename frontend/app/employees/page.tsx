'use client';

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { createPortal } from 'react-dom';

import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  getEmployees,
  addEmployeeSalary,
  updateEmployee,
  type CreateEmployeeSalaryData,
  type CreateEmployeeData,
  type Employee,
} from '@/services/employee';

import DashboardLayout from '@/components/layout/DashboardLayout';

// =====================================================
// FORMATAÇÃO
// =====================================================

function formatMoney(
  value?: number | string | null,
) {
  const number =
    Number(value || 0);

  return new Intl.NumberFormat(
    'pt-AO',
    {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 2,
    },
  ).format(number);
}

// =====================================================
// STATUS
// =====================================================

const statusLabel: Record<
  Employee['status'],
  string
> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  SUSPENDED: 'Suspenso',
  TERMINATED: 'Terminado',
};

const statusClass: Record<
  Employee['status'],
  string
> = {
  ACTIVE:
    'employees-status employees-status-active',

  INACTIVE:
    'employees-status employees-status-inactive',

  SUSPENDED:
    'employees-status employees-status-suspended',

  TERMINATED:
    'employees-status employees-status-terminated',
};

// =====================================================
// FORMULÁRIO INICIAL
// =====================================================

const initialForm: CreateEmployeeData = {
  name: '',
  nif: '',
  socialSecurityNumber: '',
  socialSecurityCategory: 'STANDARD',
  email: '',
  phone: '',
  address: '',
  birthDate: '',
  hireDate: '',
  jobTitle: '',
  department: '',
  gender: '',
  maritalStatus: '',
  dependentCount: 0,
  status: 'ACTIVE',
  notes: '',
};

const initialSalaryForm: CreateEmployeeSalaryData = {
  baseSalary: 0,
  effectiveFrom: new Date()
    .toISOString()
    .slice(0, 10),
};

// =====================================================
// PÁGINA
// =====================================================

export default function EmployeesPage() {
  const [
    employees,
    setEmployees,
  ] = useState<Employee[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(
    null,
  );

  const [
    error,
    setError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState('');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    status,
    setStatus,
  ] = useState('ALL');

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    selectedEmployee,
    setSelectedEmployee,
  ] = useState<Employee | null>(
    null,
  );

  const [
    editingEmployeeId,
    setEditingEmployeeId,
  ] = useState<string | null>(null);

  const [
    form,
    setForm,
  ] = useState<CreateEmployeeData>(
    initialForm,
  );

  const [
    includeInitialSalary,
    setIncludeInitialSalary,
  ] = useState(false);

  const [
    initialSalary,
    setInitialSalary,
  ] = useState<CreateEmployeeSalaryData>(
    initialSalaryForm,
  );

  const [
    salaryForm,
    setSalaryForm,
  ] = useState<CreateEmployeeSalaryData>(
    initialSalaryForm,
  );

  const [
    salarySaving,
    setSalarySaving,
  ] = useState(false);

  // ===================================================
  // CARREGAR FUNCIONÁRIOS
  // ===================================================

  async function loadEmployees() {
    try {
      setLoading(true);
      setError('');

      const data =
        await getEmployees();

      setEmployees(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (err: any) {
      console.error(
        'Erro ao carregar funcionários:',
        err,
      );

      setError(
        err?.response?.data?.message ||
          'Não foi possível carregar os funcionários.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEmployees();
  }, []);

  // ===================================================
  // ESC PARA FECHAR
  // ===================================================

  useEffect(() => {
    if (
      !showModal &&
      !selectedEmployee
    ) {
      return;
    }

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (
        event.key !== 'Escape'
      ) {
        return;
      }

      if (
        showModal &&
        !saving
      ) {
        setShowModal(false);
      }

      if (selectedEmployee) {
        setSelectedEmployee(null);
      }
    }

    document.addEventListener(
      'keydown',
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [
    showModal,
    selectedEmployee,
    saving,
  ]);

  // ===================================================
  // BLOQUEAR SCROLL
  // ===================================================

  useEffect(() => {
    if (
      !showModal &&
      !selectedEmployee
    ) {
      return;
    }

    const oldOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    return () => {
      document.body.style.overflow =
        oldOverflow;
    };
  }, [
    showModal,
    selectedEmployee,
  ]);

  // ===================================================
  // PESQUISA / FILTROS
  // ===================================================

  const filteredEmployees =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return employees.filter(
        (employee) => {
          const matchesSearch =
            !query ||
            employee.name
              .toLowerCase()
              .includes(query) ||
            Boolean(
              employee.nif
                ?.toLowerCase()
                .includes(query),
            ) ||
            Boolean(
              employee.employeeNumber
                ?.toLowerCase()
                .includes(query),
            ) ||
            Boolean(
              employee.jobTitle
                ?.toLowerCase()
                .includes(query),
            ) ||
            Boolean(
              employee.department
                ?.toLowerCase()
                .includes(query),
            );

          const matchesStatus =
            status === 'ALL' ||
            employee.status ===
              status;

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      employees,
      search,
      status,
    ]);

  // ===================================================
  // MÉTRICAS
  // ===================================================

  const activeEmployees =
    employees.filter(
      (employee) =>
        employee.status ===
        'ACTIVE',
    ).length;

  const inactiveEmployees =
    employees.filter(
      (employee) =>
        employee.status !==
        'ACTIVE',
    ).length;

  const totalDependents =
    employees.reduce(
      (total, employee) =>
        total +
        Number(
          employee.dependentCount ||
            0,
        ),
      0,
    );

  const totalPayroll =
    employees.reduce(
      (total, employee) => {
        const salary =
          employee.salaries?.find(
            (item) =>
              item.active,
          );

        return (
          total +
          Number(
            salary?.baseSalary ||
              0,
          )
        );
      },
      0,
    );

  // ===================================================
  // ALTERAR CAMPO
  // ===================================================

  function updateField(
    field: keyof CreateEmployeeData,
    value: string | number,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  // ===================================================
  // ABRIR NOVO
  // ===================================================

  function openCreateModal() {
    setError('');
    setSuccess('');
    setSelectedEmployee(null);
    setEditingEmployeeId(null);

    setForm({
      ...initialForm,
    });
    setIncludeInitialSalary(false);
    setInitialSalary({
      ...initialSalaryForm,
    });

    setShowModal(true);
  }

  function openEditEmployee(employee: Employee) {
    setError('');
    setSuccess('');
    setEditingEmployeeId(employee.id);
    setSelectedEmployee(null);
    setIncludeInitialSalary(false);
    setForm({
      name: employee.name,
      nif: employee.nif || '',
      socialSecurityNumber: employee.socialSecurityNumber || '',
      socialSecurityCategory:
        employee.socialSecurityCategory || 'STANDARD',
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      birthDate: employee.birthDate?.slice(0, 10) || '',
      hireDate: employee.hireDate?.slice(0, 10) || '',
      jobTitle: employee.jobTitle || '',
      department: employee.department || '',
      gender: employee.gender || '',
      maritalStatus: employee.maritalStatus || '',
      dependentCount: employee.dependentCount,
      status: employee.status,
      notes: employee.notes || '',
    });
    setShowModal(true);
  }

  async function openEmployeeDetails(employeeId: string) {
    try {
      setError('');
      const employee = await getEmployee(employeeId);
      setSelectedEmployee(employee);
      setSalaryForm({
        ...initialSalaryForm,
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Não foi possível carregar o detalhe do funcionário.',
      );
    }
  }

  async function handleAddSalary() {
    if (!selectedEmployee) {
      return;
    }

    if (
      !salaryForm.effectiveFrom ||
      !Number.isFinite(Number(salaryForm.baseSalary)) ||
      Number(salaryForm.baseSalary) < 0
    ) {
      setError(
        'Indique um salário base válido e a data de início da vigência.',
      );
      return;
    }

    try {
      setSalarySaving(true);
      setError('');
      await addEmployeeSalary(selectedEmployee.id, {
        ...salaryForm,
        baseSalary: Number(salaryForm.baseSalary),
      });
      await openEmployeeDetails(selectedEmployee.id);
      await loadEmployees();
      setSuccess('Nova vigência salarial registada com sucesso.');
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(
        Array.isArray(message)
          ? message.join(' ')
          : message || 'Não foi possível registar a vigência salarial.',
      );
    } finally {
      setSalarySaving(false);
    }
  }

  // ===================================================
  // FECHAR
  // ===================================================

  function closeCreateModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingEmployeeId(null);
  }

  // ===================================================
  // CRIAR FUNCIONÁRIO
  // ===================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !form.name ||
      !form.name.trim()
    ) {
      setError(
        'O nome do funcionário é obrigatório.',
      );

      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      /*
       * NÃO ENVIAR employeeNumber.
       *
       * O BACKEND gera automaticamente:
       *
       * 001
       * 002
       * 003
       * 004
       * ...
       */

      const payload: CreateEmployeeData =
        {
          name:
            form.name.trim(),

          nif:
            form.nif?.trim() ||
            undefined,

          socialSecurityNumber:
            form.socialSecurityNumber
              ?.trim() ||
            undefined,

          socialSecurityCategory:
            form.socialSecurityCategory ||
            'STANDARD',

          email:
            form.email?.trim() ||
            undefined,

          phone:
            form.phone?.trim() ||
            undefined,

          address:
            form.address?.trim() ||
            undefined,

          birthDate:
            form.birthDate ||
            undefined,

          hireDate:
            form.hireDate ||
            undefined,

          jobTitle:
            form.jobTitle?.trim() ||
            undefined,

          department:
            form.department
              ?.trim() ||
            undefined,

          gender:
            form.gender?.trim() ||
            undefined,

          maritalStatus:
            form.maritalStatus
              ?.trim() ||
            undefined,

          dependentCount:
            Number(
              form.dependentCount ||
                0,
            ),

          status:
            form.status ||
            'ACTIVE',

          notes:
            form.notes?.trim() ||
            undefined,

          ...(includeInitialSalary && {
            initialSalary: {
              ...initialSalary,
              baseSalary: Number(initialSalary.baseSalary),
            },
          }),
        };

      if (
        includeInitialSalary &&
        (!initialSalary.effectiveFrom ||
          !Number.isFinite(Number(initialSalary.baseSalary)) ||
          Number(initialSalary.baseSalary) < 0)
      ) {
        setError(
          'Indique um salário base válido e a data de início da vigência.',
        );
        return;
      }

      const isEditing = Boolean(editingEmployeeId);
      const saved = isEditing
        ? await updateEmployee(
            editingEmployeeId,
            payload,
          )
        : await createEmployee(
            payload,
          );

      setShowModal(false);

      setForm({
        ...initialForm,
      });
      setIncludeInitialSalary(false);
      setInitialSalary({
        ...initialSalaryForm,
      });
      setEditingEmployeeId(null);

      await loadEmployees();

      setSuccess(
        isEditing
          ? 'Dados do funcionário actualizados com sucesso.'
          : `Funcionário ${saved?.employeeNumber ? `Nº ${saved.employeeNumber} ` : ''}cadastrado com sucesso.`,
      );

      window.setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err: any) {
      console.error(
        'Erro ao criar funcionário:',
        err,
      );

      const message =
        err?.response?.data?.message;

      if (
        Array.isArray(message)
      ) {
        setError(
          message.join(' '),
        );
      } else {
        setError(
          message ||
            'Não foi possível cadastrar o funcionário.',
        );
      }
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // REMOVER
  // ===================================================

  async function handleDelete(
    employee: Employee,
  ) {
    const confirmed =
      window.confirm(
        `Tem certeza que deseja remover ${employee.name}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        employee.id,
      );

      setError('');
      setSuccess('');

      await deleteEmployee(
        employee.id,
      );

      setEmployees(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              employee.id,
          ),
      );

      setSuccess(
        'Funcionário removido com sucesso.',
      );

      window.setTimeout(() => {
        setSuccess('');
      }, 4000);
    } catch (err: any) {
      console.error(
        'Erro ao remover funcionário:',
        err,
      );

      setError(
        err?.response?.data?.message ||
          'Não foi possível remover o funcionário.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ===================================================
  // INICIAIS
  // ===================================================

  function getInitials(
    name: string,
  ) {
    return (
      name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(
          (word) =>
            word.charAt(0),
        )
        .join('')
        .toUpperCase() ||
      'FN'
    );
  }

  // ===================================================
  // MODAL NOVO FUNCIONÁRIO
  // ===================================================

  function renderCreateModal() {
    if (
      !showModal ||
      typeof document ===
        'undefined'
    ) {
      return null;
    }

    return createPortal(
      <div
        className="employees-modal-backdrop"
        onMouseDown={(
          event,
        ) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            closeCreateModal();
          }
        }}
      >
        <div
          className="employees-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employees-new-title"
          onMouseDown={(
            event,
          ) =>
            event.stopPropagation()
          }
        >
          {/* HEADER */}

          <div className="employees-modal-header">
            <div className="employees-modal-heading">
              <div className="employees-modal-icon">
                <UserPlus
                  size={20}
                />
              </div>

              <div>
                <h2
                  id="employees-new-title"
                  className="employees-modal-title"
                >
                  {editingEmployeeId
                    ? 'Editar funcionário'
                    : 'Novo funcionário'}
                </h2>

                <p className="employees-modal-subtitle">
                  {editingEmployeeId
                    ? 'Actualize apenas os dados necessários'
                    : 'Registe os dados do colaborador'}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="employees-modal-close"
              onClick={
                closeCreateModal
              }
              disabled={
                saving
              }
            >
              <X size={18} />
            </button>
          </div>

          {/* FORM */}

          <form
            className="employees-form"
            onSubmit={
              handleSubmit
            }
          >
            {/* DADOS PESSOAIS */}

            <section className="employees-form-section">
              <div className="employees-section-title">
                <Users size={14} />

                Dados pessoais

                <span />
              </div>

              <div className="employees-form-grid">

                <div className="employees-field employees-field-full">
                  <label>
                    Nome completo *
                  </label>

                  <input
                    value={
                      form.name
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'name',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Ex.: João Manuel"
                    required
                    autoFocus
                    disabled={
                      saving
                    }
                  />
                </div>

                <div className="employees-field">
                  <label>
                    NIF
                  </label>

                  <input
                    value={
                      form.nif ||
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'nif',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Número de identificação fiscal"
                    disabled={
                      saving
                    }
                  />
                </div>

                <div className="employees-field">
                  <label>
                    Segurança Social
                  </label>

                  <input
                    value={
                      form.socialSecurityNumber ||
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'socialSecurityNumber',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Número da Segurança Social"
                    disabled={
                      saving
                    }
                  />
                </div>

                <div className="employees-field">
                  <label htmlFor="social-security-category">
                    Enquadramento contributivo
                  </label>

                  <select
                    id="social-security-category"
                    value={
                      form.socialSecurityCategory ||
                      'STANDARD'
                    }
                    onChange={(event) =>
                      updateField(
                        'socialSecurityCategory',
                        event.target.value,
                      )
                    }
                    disabled={saving}
                  >
                    <option value="STANDARD">
                      Trabalhador por conta de outrem
                    </option>
                    <option value="RETIRED">
                      Trabalhador reformado
                    </option>
                    <option value="SPECIAL">
                      Regime especial (requer configuração)
                    </option>
                  </select>
                </div>

              </div>
            </section>

            {/* DADOS PROFISSIONAIS */}

            <section className="employees-form-section">
              <div className="employees-section-title">
                <Briefcase
                  size={14}
                />

                Dados profissionais

                <span />
              </div>

              <div className="employees-form-grid">

                {/* NÚMERO AUTOMÁTICO */}

                <div className="employees-field employees-field-full">
                  <label>
                    Número do funcionário
                  </label>

                  <div className="employees-auto-number">
                    <div className="employees-auto-number-icon">
                      <ShieldCheck
                        size={17}
                      />
                    </div>

                    <div>
                      <strong>
                        Gerado automaticamente
                      </strong>

                      <p>
                        O sistema atribuirá
                        automaticamente o
                        próximo número disponível
                        após o cadastro.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="employees-field">
                  <label>
                    Cargo
                  </label>

                  <input
                    value={
                      form.jobTitle ||
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'jobTitle',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Ex.: Técnico de Contabilidade"
                    disabled={
                      saving
                    }
                  />
                </div>

                <div className="employees-field">
                  <label>
                    Departamento
                  </label>

                  <input
                    value={
                      form.department ||
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'department',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Ex.: Financeiro"
                    disabled={
                      saving
                    }
                  />
                </div>

                <div className="employees-field">
                  <label>
                    Data de admissão
                  </label>

                  <input
                    type="date"
                    value={
                      form.hireDate ||
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'hireDate',
                        event
                          .target
                          .value,
                      )
                    }
                    disabled={
                      saving
                    }
                  />
                </div>

                <div className="employees-field">
                  <label>
                    Dependentes fiscais
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.dependentCount ??
                      0
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'dependentCount',
                        Math.max(
                          0,
                          Number(
                            event
                              .target
                              .value ||
                              0,
                          ),
                        ),
                      )
                    }
                    disabled={
                      saving
                    }
                  />
                </div>

              </div>
            </section>

            {!editingEmployeeId && (
            <section className="employees-form-section">
              <div className="employees-section-title">
                <CircleDollarSign size={14} />

                Salário inicial

                <span />
              </div>

              <label className="employees-checkbox-field">
                <input
                  type="checkbox"
                  checked={includeInitialSalary}
                  onChange={(event) =>
                    setIncludeInitialSalary(event.target.checked)
                  }
                  disabled={saving}
                />
                <span>
                  Registar a primeira vigência salarial agora
                </span>
              </label>

              {includeInitialSalary && (
                <div className="employees-form-grid">
                  <div className="employees-field">
                    <label htmlFor="initial-base-salary">
                      Salário base (Kz)
                    </label>
                    <input
                      id="initial-base-salary"
                      type="number"
                      min="0"
                      step="0.01"
                      value={initialSalary.baseSalary}
                      onChange={(event) =>
                        setInitialSalary((current) => ({
                          ...current,
                          baseSalary: Number(event.target.value || 0),
                        }))
                      }
                      disabled={saving}
                      required
                    />
                  </div>

                  <div className="employees-field">
                    <label htmlFor="initial-salary-effective-from">
                      Vigente desde
                    </label>
                    <input
                      id="initial-salary-effective-from"
                      type="date"
                      value={initialSalary.effectiveFrom}
                      onChange={(event) =>
                        setInitialSalary((current) => ({
                          ...current,
                          effectiveFrom: event.target.value,
                        }))
                      }
                      disabled={saving}
                      required
                    />
                  </div>
                </div>
              )}
            </section>
            )}

            {/* CONTACTO */}

            <section className="employees-form-section">
              <div className="employees-section-title">
                <Phone size={14} />

                Contacto

                <span />
              </div>

              <div className="employees-form-grid">

                <div className="employees-field">
                  <label>
                    Telefone
                  </label>

                  <input
                    value={
                      form.phone ||
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'phone',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="+244 9xx xxx xxx"
                    disabled={
                      saving
                    }
                  />
                </div>

                <div className="employees-field">
                  <label>
                    E-mail
                  </label>

                  <input
                    type="email"
                    value={
                      form.email ||
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'email',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="funcionario@empresa.ao"
                    disabled={
                      saving
                    }
                  />
                </div>

                <div className="employees-field employees-field-full">
                  <label>
                    Morada
                  </label>

                  <input
                    value={
                      form.address ||
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'address',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Morada do funcionário"
                    disabled={
                      saving
                    }
                  />
                </div>

              </div>
            </section>

            {/* INFORMAÇÕES ADICIONAIS */}

            <section className="employees-form-section">
              <div className="employees-section-title">
                <CalendarDays
                  size={14}
                />

                Informações adicionais

                <span />
              </div>

              <div className="employees-form-grid">

                <div className="employees-field">
                  <label>
                    Data de nascimento
                  </label>

                  <input
                    type="date"
                    value={
                      form.birthDate ||
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'birthDate',
                        event
                          .target
                          .value,
                      )
                    }
                    disabled={
                      saving
                    }
                  />
                </div>

                <div className="employees-field">
                  <label>
                    Estado civil
                  </label>

                  <input
                    value={
                      form.maritalStatus ||
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'maritalStatus',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Ex.: Solteiro"
                    disabled={
                      saving
                    }
                  />
                </div>

                <div className="employees-field">
                  <label>
                    Género
                  </label>

                  <input
                    value={
                      form.gender ||
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'gender',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Ex.: Masculino"
                    disabled={
                      saving
                    }
                  />
                </div>

              </div>
            </section>

            {/* OBSERVAÇÕES */}

            <section className="employees-form-section">
              <div className="employees-section-title">
                <FileText
                  size={14}
                />

                Observações

                <span />
              </div>

              <div className="employees-form-grid">

                <div className="employees-field employees-field-full">
                  <textarea
                    value={
                      form.notes ||
                      ''
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'notes',
                        event
                          .target
                          .value,
                      )
                    }
                    rows={3}
                    placeholder="Observações internas sobre o funcionário..."
                    disabled={
                      saving
                    }
                  />
                </div>

              </div>
            </section>

            {/* FOOTER */}

            <div className="employees-modal-footer">

              <button
                type="button"
                className="employees-secondary-button"
                onClick={
                  closeCreateModal
                }
                disabled={
                  saving
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="employees-primary-button"
                disabled={
                  saving
                }
              >
                <ShieldCheck
                  size={16}
                />

                {saving
                  ? 'A guardar...'
                  : editingEmployeeId
                    ? 'Guardar alterações'
                    : 'Cadastrar funcionário'}
              </button>

            </div>
          </form>
        </div>
      </div>,
      document.body,
    );
  }

  // ===================================================
  // MODAL VISUALIZAR
  // ===================================================

  function renderEmployeeModal() {
    if (
      !selectedEmployee ||
      typeof document ===
        'undefined'
    ) {
      return null;
    }

    const employee =
      selectedEmployee;

    const salary =
      employee.salaries?.find(
        (item) =>
          item.active,
      );

    return createPortal(
      <div
        className="employees-modal-backdrop"
        onMouseDown={(
          event,
        ) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            setSelectedEmployee(
              null,
            );
          }
        }}
      >
        <div
          className="employees-modal employees-view-modal"
          role="dialog"
          aria-modal="true"
          onMouseDown={(
            event,
          ) =>
            event.stopPropagation()
          }
        >
          <div className="employees-modal-header">
            <div className="employees-modal-heading">

              <div className="employees-avatar-large">
                {getInitials(
                  employee.name,
                )}
              </div>

              <div>
                <h2 className="employees-modal-title">
                  {
                    employee.name
                  }
                </h2>

                <p className="employees-modal-subtitle">
                  Perfil do funcionário
                </p>
              </div>

            </div>

            <button
              type="button"
              className="employees-modal-close"
              onClick={() =>
                setSelectedEmployee(
                  null,
                )
              }
            >
              <X size={18} />
            </button>
          </div>

          <div className="employees-view-content">

            <div className="employees-profile-card">

              <div className="employees-profile-number">
                Nº{' '}
                {employee.employeeNumber ||
                  '—'}
              </div>

              <div className="employees-profile-name">
                {
                  employee.name
                }
              </div>

              <div className="employees-profile-role">
                {
                  employee.jobTitle ||
                  'Cargo não definido'
                }
              </div>

              <span
                className={
                  statusClass[
                    employee.status
                  ]
                }
              >
                <span className="employees-status-dot" />

                {
                  statusLabel[
                    employee.status
                  ]
                }
              </span>

            </div>

            <div className="employees-form-grid">

              <div className="employees-info-field">
                <label>
                  NIF
                </label>

                <strong>
                  {
                    employee.nif ||
                    'Não informado'
                  }
                </strong>
              </div>

              <div className="employees-info-field">
                <label>
                  Segurança Social
                </label>

                <strong>
                  {
                    employee.socialSecurityNumber ||
                    'Não informado'
                  }
                </strong>
              </div>

              <div className="employees-info-field">
                <label>
                  Enquadramento contributivo
                </label>

                <strong>
                  {employee.socialSecurityCategory === 'RETIRED'
                    ? 'Trabalhador reformado'
                    : employee.socialSecurityCategory === 'SPECIAL'
                      ? 'Regime especial'
                      : 'Trabalhador por conta de outrem'}
                </strong>
              </div>

              <div className="employees-info-field">
                <label>
                  Número do funcionário
                </label>

                <strong className="employees-blue-text">
                  Nº{' '}
                  {employee.employeeNumber ||
                    '—'}
                </strong>
              </div>

              <div className="employees-info-field">
                <label>
                  Estado
                </label>

                <span
                  className={
                    statusClass[
                      employee.status
                    ]
                  }
                >
                  <span className="employees-status-dot" />

                  {
                    statusLabel[
                      employee.status
                    ]
                  }
                </span>
              </div>

              <div className="employees-info-field">
                <label>
                  Cargo
                </label>

                <strong>
                  {
                    employee.jobTitle ||
                    'Não definido'
                  }
                </strong>
              </div>

              <div className="employees-info-field">
                <label>
                  Departamento
                </label>

                <strong>
                  {
                    employee.department ||
                    'Não definido'
                  }
                </strong>
              </div>

              <div className="employees-info-field">
                <label>
                  Telefone
                </label>

                <strong>
                  {
                    employee.phone ||
                    'Não informado'
                  }
                </strong>
              </div>

              <div className="employees-info-field">
                <label>
                  E-mail
                </label>

                <strong>
                  {
                    employee.email ||
                    'Não informado'
                  }
                </strong>
              </div>

              <div className="employees-info-field">
                <label>
                  Dependentes
                </label>

                <strong>
                  {Number(
                    employee.dependentCount ||
                      0,
                  )}
                </strong>
              </div>

              <div className="employees-info-field">
                <label>
                  Salário base
                </label>

                <strong>
                  {salary
                    ? formatMoney(
                        salary.baseSalary,
                      )
                    : 'Não definido'}
                </strong>
              </div>

              <div className="employees-info-field">
                <label>
                  Data de admissão
                </label>

                <strong>
                  {
                    employee.hireDate
                      ? new Date(
                          employee.hireDate,
                        ).toLocaleDateString(
                          'pt-AO',
                        )
                      : 'Não informado'
                  }
                </strong>
              </div>

              <div className="employees-info-field">
                <label>
                  Data de nascimento
                </label>

                <strong>
                  {
                    employee.birthDate
                      ? new Date(
                          employee.birthDate,
                        ).toLocaleDateString(
                          'pt-AO',
                        )
                      : 'Não informado'
                  }
                </strong>
              </div>

              <div className="employees-info-field">
                <label>
                  Estado civil
                </label>

                <strong>
                  {
                    employee.maritalStatus ||
                    'Não informado'
                  }
                </strong>
              </div>

              <div className="employees-info-field">
                <label>
                  Género
                </label>

                <strong>
                  {
                    employee.gender ||
                    'Não informado'
                  }
                </strong>
              </div>

              <div className="employees-info-field employees-field-full">
                <label>
                  Morada
                </label>

                <strong>
                  {
                    employee.address ||
                    'Não informada'
                  }
                </strong>
              </div>

              <div className="employees-info-field employees-field-full">
                <label>
                  Observações
                </label>

                <strong className="employees-notes">
                  {
                    employee.notes ||
                    'Sem observações.'
                  }
                </strong>
              </div>

            </div>

            <section className="employees-form-section employees-salary-history">
              <div className="employees-section-title">
                <CircleDollarSign size={14} />

                Histórico salarial

                <span />
              </div>

              {employee.salaries?.length ? (
                <div className="employees-salary-list">
                  {employee.salaries.map((item) => (
                    <div key={item.id} className="employees-salary-entry">
                      <div>
                        <strong>{formatMoney(item.baseSalary)}</strong>
                        <p>
                          Vigente desde {new Date(item.effectiveFrom).toLocaleDateString('pt-AO')}
                          {item.effectiveTo
                            ? ` até ${new Date(item.effectiveTo).toLocaleDateString('pt-AO')}`
                            : ' · actual'}
                        </p>
                      </div>
                      <span className={item.active ? 'employees-salary-state employees-salary-state-active' : 'employees-salary-state'}>
                        {item.active ? 'Actual' : 'Histórico'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="employees-salary-empty">
                  Ainda não existe uma vigência salarial registada.
                </p>
              )}

              <div className="employees-form-grid employees-new-salary-form">
                <div className="employees-field">
                  <label htmlFor="salary-base">
                    Novo salário base (Kz)
                  </label>
                  <input
                    id="salary-base"
                    type="number"
                    min="0"
                    step="0.01"
                    value={salaryForm.baseSalary}
                    onChange={(event) =>
                      setSalaryForm((current) => ({
                        ...current,
                        baseSalary: Number(event.target.value || 0),
                      }))
                    }
                    disabled={salarySaving}
                  />
                </div>

                <div className="employees-field">
                  <label htmlFor="salary-effective-from">
                    Nova vigência desde
                  </label>
                  <input
                    id="salary-effective-from"
                    type="date"
                    value={salaryForm.effectiveFrom}
                    onChange={(event) =>
                      setSalaryForm((current) => ({
                        ...current,
                        effectiveFrom: event.target.value,
                      }))
                    }
                    disabled={salarySaving}
                  />
                </div>

                <div className="employees-field employees-salary-action">
                  <label> </label>
                  <button
                    type="button"
                    className="employees-secondary-button"
                    onClick={handleAddSalary}
                    disabled={salarySaving}
                  >
                    {salarySaving ? 'A registar...' : 'Registar vigência'}
                  </button>
                </div>
              </div>
            </section>

            <div className="employees-modal-footer">
              <button
                type="button"
                className="employees-secondary-button"
                onClick={() => openEditEmployee(employee)}
              >
                Editar dados
              </button>
              <button
                type="button"
                className="employees-secondary-button"
                onClick={() =>
                  setSelectedEmployee(
                    null,
                  )
                }
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      </div>,
      document.body,
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      <DashboardLayout>
        <div className="employees-page fd-workspace-page fd-theme-scope">

          <style jsx global>{`

            /* =====================================================
               PÁGINA
            ===================================================== */

            .employees-page {
              width: 100%;
              min-height: 100%;
              max-width: 1440px;
              margin: 0 auto;
              color: var(--fd-text-primary);
            }

            .employees-hero {
              position: relative;
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 24px;
              padding: 0 0 20px;
              margin-bottom: 20px;
              border-bottom: 1px solid var(--fd-border);
            }

            .employees-hero-content {
              position: relative;
              z-index: 2;
            }

            .employees-eyebrow {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;
              color: #2563eb;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: .12em;
            }

            .employees-eyebrow-dot {
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: #06b6d4;
            }

            .employees-hero h1 {
              margin: 0;
              font-size: 28px;
              line-height: 1.2;
              font-weight: 650;
              letter-spacing: -.025em;
            }

            .employees-hero h1 span {
              color: inherit;
            }

            .employees-description {
              max-width: 620px;
              margin-top: 9px;
              color: var(--fd-text-secondary);
              font-size: 13px;
              line-height: 1.6;
            }

            .employees-hero-actions {
              display: flex;
              align-items: center;
              gap: 9px;
            }

            /* =====================================================
               BOTÕES
            ===================================================== */

            .employees-primary-button,
            .employees-secondary-button {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              min-height: 43px;
              padding: 0 16px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 750;
              cursor: pointer;
              transition: background-color .15s ease, border-color .15s ease;
            }

            .employees-primary-button {
              border: 1px solid transparent;
              background: var(--fd-primary);
              color: #fff;
            }

            .employees-primary-button:hover {
              background: var(--fd-primary-hover);
            }

            .employees-primary-button:disabled {
              opacity: .6;
              cursor: not-allowed;
              transform: none;
            }

            .employees-secondary-button {
              border: 1px solid var(--fd-border);
              background: var(--fd-surface);
              color: var(--fd-text-secondary);
            }

            .employees-secondary-button:hover {
              background: var(--fd-surface-muted);
              color: var(--fd-text-primary);
            }

            .employees-secondary-button:disabled {
              opacity: .6;
              cursor: not-allowed;
            }

            /* =====================================================
               ALERTAS
            ===================================================== */

            .employees-alert {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              padding: 12px 15px;
              margin-bottom: 16px;
              border-radius: 6px;
              font-size: 12px;
            }

            .employees-alert-error {
              border: 1px solid #fecaca;
              background: #fff5f5;
              color: #b91c1c;
            }

            .employees-alert-success {
              border: 1px solid #bbf7d0;
              background: #f0fdf4;
              color: #15803d;
            }

            /* =====================================================
               MÉTRICAS
            ===================================================== */

            .employees-metrics {
              display: grid;
              grid-template-columns:
                repeat(4, minmax(0, 1fr));
              gap: 0;
              margin-bottom: 19px;
              border: 1px solid var(--fd-border);
              background: var(--fd-surface);
            }

            .employees-metric {
              min-height: 92px;
              padding: 17px;
              border: 0;
              border-right: 1px solid var(--fd-border);
              border-radius: 0;
              background: transparent;
            }

            .employees-metric:last-child {
              border-right: 0;
            }

            .employees-metric-top {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }

            .employees-metric-label {
              color: #64748b;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: .06em;
            }

            .employees-metric-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 37px;
              height: 37px;
              border-radius: 0;
              color: var(--fd-muted) !important;
              background: transparent !important;
            }

            .employees-metric-value {
              margin-top: 12px;
              color: var(--fd-text-primary);
              font-size: 21px;
              font-weight: 650;
              letter-spacing: -.035em;
            }

            .employees-metric-detail {
              margin-top: 6px;
              color: var(--fd-muted);
              font-size: 10px;
            }

            /* =====================================================
               WORKSPACE
            ===================================================== */

            .employees-workspace {
              overflow: hidden;
              border: 1px solid var(--fd-border);
              border-radius: 0;
              background: var(--fd-surface);
            }

            .employees-toolbar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 14px;
              padding: 15px;
              border-bottom:
                1px solid var(--fd-border);
            }

            .employees-search {
              display: flex;
              align-items: center;
              gap: 9px;
              width: min(580px, 100%);
              min-height: 43px;
              padding: 0 12px;
              border:
                1px solid var(--fd-border);
              border-radius: 6px;
              background: var(--fd-input);
            }

            .employees-search:focus-within {
              border-color: var(--fd-primary);
              background: var(--fd-input);
              box-shadow: 0 0 0 3px var(--fd-focus);
            }

            .employees-search svg {
              flex-shrink: 0;
              color: #94a3b8;
            }

            .employees-search input {
              width: 100%;
              border: 0;
              outline: 0;
              background: transparent;
              font-size: 12px;
            }

            .employees-filter {
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .employees-filter-label {
              color: #94a3b8;
              font-size: 10px;
              font-weight: 750;
              text-transform: uppercase;
            }

            .employees-select {
              min-height: 43px;
              padding: 0 30px 0 11px;
              border:
                1px solid var(--fd-border);
              border-radius: 6px;
              background: var(--fd-input);
              color: var(--fd-text-primary);
              font-size: 11px;
              font-weight: 650;
              outline: none;
            }

            .employees-results {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 11px 17px;
              border-bottom:
                1px solid var(--fd-border);
              background: var(--fd-table-header);
              color: var(--fd-text-secondary);
              font-size: 10px;
            }

            .employees-results strong {
              color: #334155;
            }

            .employees-table-wrap {
              overflow-x: auto;
            }

            .employees-table {
              width: 100%;
              min-width: 920px;
              border-collapse: collapse;
            }

            .employees-table th {
              padding: 12px 17px;
              border-bottom:
                1px solid var(--fd-border);
              background: var(--fd-table-header);
              color: var(--fd-text-secondary);
              font-size: 9px;
              font-weight: 800;
              text-align: left;
              text-transform: uppercase;
              letter-spacing: .075em;
            }

            .employees-table td {
              padding: 14px 17px;
              border-bottom:
                1px solid var(--fd-border);
              color: var(--fd-text-secondary);
              font-size: 11px;
              vertical-align: middle;
            }

            .employees-table tbody tr:hover {
              background: var(--fd-surface-muted);
            }

            /* =====================================================
               FUNCIONÁRIO
            ===================================================== */

            .employees-person {
              display: flex;
              align-items: center;
              gap: 10px;
            }

            .employees-avatar {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 38px;
              height: 38px;
              flex-shrink: 0;
              border-radius: 6px;
              background: var(--fd-surface-muted);
              color: var(--fd-primary);
              font-size: 10px;
              font-weight: 850;
            }

            .employees-person-name {
              color: var(--fd-text-primary);
              font-size: 11px;
              font-weight: 800;
            }

            .employees-person-number {
              margin-top: 3px;
              color: #94a3b8;
              font-size: 9px;
            }

            .employees-salary {
              color: var(--fd-text-primary);
              font-weight: 800;
              white-space: nowrap;
            }

            /* =====================================================
               STATUS
            ===================================================== */

            .employees-status {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 5px 8px;
              border: 1px solid;
              border-radius: 5px;
              font-size: 9px;
              font-weight: 800;
            }

            .employees-status-active {
              border-color: #a7f3d0;
              background: #ecfdf5;
              color: #047857;
            }

            .employees-status-inactive {
              border-color: #e2e8f0;
              background: #f8fafc;
              color: #64748b;
            }

            .employees-status-suspended {
              border-color: #fde68a;
              background: #fffbeb;
              color: #b45309;
            }

            .employees-status-terminated {
              border-color: #fecaca;
              background: #fef2f2;
              color: #b91c1c;
            }

            .employees-status-dot {
              width: 5px;
              height: 5px;
              border-radius: 50%;
              background: currentColor;
            }

            /* =====================================================
               AÇÕES
            ===================================================== */

            .employees-actions {
              display: flex;
              justify-content: flex-end;
              gap: 6px;
            }

            .employees-action {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
              min-height: 32px;
              padding: 0 9px;
              border:
                1px solid #e2e8f0;
              border-radius: 8px;
              background: #fff;
              color: #64748b;
              font-size: 9px;
              font-weight: 750;
              cursor: pointer;
            }

            .employees-action:hover {
              border-color: #bfdbfe;
              background: #eff6ff;
              color: #2563eb;
            }

            .employees-action-delete:hover {
              border-color: #fecaca;
              background: #fff1f2;
              color: #dc2626;
            }

            /* =====================================================
               ESTADOS
            ===================================================== */

            .employees-state {
              padding: 60px 20px;
              text-align: center;
            }

            .employees-state-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 50px;
              height: 50px;
              margin: 0 auto 12px;
              border-radius: 15px;
              background: #eff6ff;
              color: #2563eb;
            }

            .employees-state-title {
              color: #0f172a;
              font-size: 13px;
              font-weight: 800;
            }

            .employees-state-description {
              max-width: 430px;
              margin: 6px auto 0;
              color: #94a3b8;
              font-size: 11px;
              line-height: 1.6;
            }

            /* =====================================================
               =====================================================
               MODAL
               =====================================================
            ===================================================== */

            .employees-modal-backdrop {
              position: fixed !important;
              inset: 0 !important;
              z-index: 999999 !important;

              display: flex !important;
              align-items: center !important;
              justify-content: center !important;

              width: 100vw !important;
              height: 100vh !important;

              padding: 20px !important;
              box-sizing: border-box !important;

              background:
                rgba(15, 23, 42, .58) !important;

              animation:
                employeesBackdropIn
                .18s ease-out;
            }

            @keyframes employeesBackdropIn {
              from {
                opacity: 0;
              }

              to {
                opacity: 1;
              }
            }

            .employees-modal {
              position: relative !important;

              display: flex !important;
              flex-direction: column !important;

              width:
                min(820px, calc(100vw - 40px)) !important;

              max-width: 820px !important;

              max-height:
                calc(100vh - 40px) !important;

              margin: 0 auto !important;

              overflow: hidden !important;

              border:
                1px solid var(--fd-border) !important;

              border-radius: 8px !important;

              background:
                var(--fd-surface-raised) !important;

              box-shadow:
                0 24px 60px
                rgba(2, 8, 23, .28) !important;

              animation:
                employeesModalIn
                .22s ease-out;
            }

            .employees-view-modal {
              max-width: 700px !important;
            }

            @keyframes employeesModalIn {
              from {
                opacity: 0;
                transform:
                  translateY(15px)
                  scale(.975);
              }

              to {
                opacity: 1;
                transform:
                  translateY(0)
                  scale(1);
              }
            }

            .employees-modal-header {
              position: relative !important;
              z-index: 5 !important;

              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;

              gap: 15px !important;

              padding:
                19px 22px !important;

              border-bottom:
                1px solid var(--fd-border) !important;

              background:
                var(--fd-surface-raised) !important;

              flex-shrink: 0 !important;
            }

            .employees-modal-heading {
              display: flex !important;
              align-items: center !important;
              gap: 12px !important;
              min-width: 0 !important;
            }

            .employees-modal-icon {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;

              width: 42px !important;
              height: 42px !important;

              flex-shrink: 0 !important;

              border-radius: 6px !important;
              background: var(--fd-surface-muted) !important;
              color: var(--fd-primary) !important;
            }

            .employees-modal-title {
              margin: 0 !important;
              color: var(--fd-text-primary) !important;
              font-size: 18px !important;
              line-height: 1.2 !important;
              font-weight: 850 !important;
            }

            .employees-modal-subtitle {
              margin: 4px 0 0 !important;
              color: var(--fd-muted) !important;
              font-size: 10px !important;
            }

            .employees-modal-close {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;

              width: 35px !important;
              height: 35px !important;

              flex-shrink: 0 !important;

              border:
                1px solid var(--fd-border) !important;

              border-radius: 6px !important;

              background: var(--fd-surface) !important;
              color: var(--fd-text-secondary) !important;

              cursor: pointer !important;
            }

            .employees-modal-close:hover {
              border-color: #fecaca !important;
              background: #fff1f2 !important;
              color: #dc2626 !important;
            }

            .employees-form {
              display: block !important;

              width: 100% !important;

              max-height:
                calc(100vh - 120px) !important;

              overflow-y: auto !important;
              overflow-x: hidden !important;

              padding:
                22px !important;

              box-sizing: border-box !important;

              background: var(--fd-surface-raised) !important;
            }

            .employees-form-section {
              margin-bottom: 23px !important;
            }

            .employees-checkbox-field {
              display: flex !important;
              align-items: center !important;
              gap: 8px !important;
              margin: 0 0 13px !important;
              color: var(--fd-text-secondary) !important;
              font-size: 12px !important;
            }

            .employees-checkbox-field input {
              width: 15px !important;
              height: 15px !important;
              accent-color: var(--fd-primary) !important;
            }

            .employees-section-title {
              display: flex !important;
              align-items: center !important;
              gap: 8px !important;

              margin-bottom: 12px !important;

              color: var(--fd-text-primary) !important;

              font-size: 10px !important;
              font-weight: 850 !important;

              text-transform: uppercase !important;
              letter-spacing: .08em !important;
            }

            .employees-section-title span {
              flex: 1 !important;
              height: 1px !important;
              background: var(--fd-border) !important;
            }

            .employees-form-grid {
              display: grid !important;

              grid-template-columns:
                repeat(2, minmax(0, 1fr)) !important;

              gap: 13px !important;

              width: 100% !important;
            }

            .employees-field {
              display: flex !important;
              flex-direction: column !important;
              gap: 6px !important;
              min-width: 0 !important;
            }

            .employees-field-full {
              grid-column: 1 / -1 !important;
            }

            .employees-field label {
              color: var(--fd-text-secondary) !important;
              font-size: 10px !important;
              font-weight: 750 !important;
            }

            .employees-field input,
            .employees-field textarea {
              display: block !important;

              width: 100% !important;
              box-sizing: border-box !important;

              border:
                1px solid var(--fd-border) !important;

              border-radius: 6px !important;

              outline: none !important;

              background: var(--fd-input) !important;

              color: var(--fd-text-primary) !important;

              font-family:
                inherit !important;

              font-size: 11px !important;
            }

            .employees-field input {
              min-height: 42px !important;
              padding:
                0 12px !important;
            }

            .employees-field textarea {
              min-height: 78px !important;
              padding: 11px 12px !important;
              resize: vertical !important;
            }

            .employees-field input:focus,
            .employees-field textarea:focus {
              border-color: var(--fd-primary) !important;
              background: var(--fd-input) !important;
              box-shadow: 0 0 0 3px var(--fd-focus) !important;
            }

            .employees-field input:disabled,
            .employees-field textarea:disabled {
              opacity: .65 !important;
              cursor: not-allowed !important;
            }

            /* =====================================================
               NÚMERO AUTOMÁTICO
            ===================================================== */

            .employees-auto-number {
              display: flex !important;
              align-items: center !important;
              gap: 11px !important;

              min-height: 64px !important;

              padding:
                10px 12px !important;

              box-sizing: border-box !important;

              border:
                1px solid var(--fd-border) !important;

              border-radius: 6px !important;
              background: var(--fd-surface-muted) !important;
            }

            .employees-auto-number-icon {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;

              width: 35px !important;
              height: 35px !important;

              flex-shrink: 0 !important;

              border-radius: 9px !important;

              background: var(--fd-surface) !important;
              color: var(--fd-primary) !important;
            }

            .employees-auto-number strong {
              display: block !important;
              color: var(--fd-text-primary) !important;
              font-size: 11px !important;
              font-weight: 800 !important;
            }

            .employees-auto-number p {
              margin: 3px 0 0 !important;
              color: var(--fd-text-secondary) !important;
              font-size: 9px !important;
              line-height: 1.5 !important;
            }

            /* =====================================================
               FOOTER MODAL
            ===================================================== */

            .employees-modal-footer {
              display: flex !important;
              align-items: center !important;
              justify-content: flex-end !important;
              gap: 9px !important;

              padding-top: 18px !important;
              margin-top: 4px !important;

              border-top:
                1px solid var(--fd-border) !important;
            }

            /* =====================================================
               VISUALIZAÇÃO
            ===================================================== */

            .employees-view-content {
              padding: 22px !important;

              overflow-y: auto !important;
            }

            .employees-avatar-large {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;

              width: 44px !important;
              height: 44px !important;

              flex-shrink: 0 !important;

              border-radius: 6px !important;
              background: var(--fd-surface-muted) !important;
              color: var(--fd-primary) !important;

              font-size: 11px !important;
              font-weight: 850 !important;
            }

            .employees-profile-card {
              display: grid !important;

              grid-template-columns:
                1fr auto !important;

              gap: 5px 15px !important;

              margin-bottom: 20px !important;
              padding: 16px !important;

              border:
                1px solid var(--fd-border) !important;

              border-radius: 6px !important;
              background: var(--fd-surface-muted) !important;
            }

            .employees-profile-number {
              grid-column: 1 / -1 !important;

              color: var(--fd-primary) !important;

              font-size: 9px !important;
              font-weight: 850 !important;

              text-transform: uppercase !important;
              letter-spacing: .08em !important;
            }

            .employees-profile-name {
              color: var(--fd-text-primary) !important;
              font-size: 14px !important;
              font-weight: 850 !important;
            }

            .employees-profile-role {
              color: var(--fd-text-secondary) !important;
              font-size: 10px !important;
            }

            .employees-info-field {
              display: flex !important;
              flex-direction: column !important;
              gap: 5px !important;

              min-height: 48px !important;
              padding: 9px 11px !important;

              border:
                1px solid #edf1f6 !important;

              border-radius: 10px !important;

              background: #fbfcfe !important;
            }

            .employees-info-field label {
              color: #94a3b8 !important;
              font-size: 9px !important;
              font-weight: 750 !important;
              text-transform: uppercase !important;
            }

            .employees-info-field strong {
              color: #334155 !important;
              font-size: 11px !important;
              font-weight: 650 !important;
              overflow-wrap: anywhere !important;
            }

            .employees-blue-text {
              color: #2563eb !important;
              font-weight: 850 !important;
            }

            .employees-notes {
              white-space: pre-wrap !important;
              line-height: 1.5 !important;
            }

            .employees-salary-history {
              padding-top: 4px !important;
              border-top: 1px solid var(--fd-border) !important;
            }

            .employees-salary-list {
              display: grid !important;
              gap: 8px !important;
              margin-bottom: 14px !important;
            }

            .employees-salary-entry {
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              gap: 12px !important;
              padding: 10px 12px !important;
              border: 1px solid var(--fd-border) !important;
              border-radius: 8px !important;
              background: var(--fd-surface-raised) !important;
            }

            .employees-salary-entry strong {
              display: block !important;
              color: var(--fd-text-primary) !important;
              font-size: 12px !important;
            }

            .employees-salary-entry p,
            .employees-salary-empty {
              margin: 3px 0 0 !important;
              color: var(--fd-text-secondary) !important;
              font-size: 11px !important;
            }

            .employees-salary-state {
              flex: none !important;
              color: var(--fd-text-secondary) !important;
              font-size: 10px !important;
              font-weight: 700 !important;
            }

            .employees-salary-state-active {
              color: #047857 !important;
            }

            .employees-salary-action {
              justify-content: flex-end !important;
            }

            /* =====================================================
               RESPONSIVO
            ===================================================== */

            @media (max-width: 1000px) {
              .employees-metrics {
                grid-template-columns:
                  repeat(2, minmax(0, 1fr));
              }

              .employees-hero {
                align-items: flex-start;
                flex-direction: column;
              }
            }

            @media (max-width: 700px) {
              .employees-hero {
                padding: 20px;
              }

              .employees-hero-actions {
                width: 100%;
              }

              .employees-hero-actions button {
                flex: 1;
              }

              .employees-metrics {
                grid-template-columns: 1fr;
              }

              .employees-toolbar {
                align-items: stretch;
                flex-direction: column;
              }

              .employees-search {
                width: 100%;
              }

              .employees-filter {
                justify-content: space-between;
              }

              .employees-select {
                flex: 1;
              }

              .employees-modal-backdrop {
                align-items: flex-end !important;
                padding: 10px !important;
              }

              .employees-modal {
                width:
                  calc(100vw - 20px) !important;

                max-width:
                  calc(100vw - 20px) !important;

                max-height:
                  calc(100vh - 20px) !important;

                border-radius:
                  20px !important;
              }

              .employees-modal-header {
                padding:
                  16px !important;
              }

              .employees-form {
                padding:
                  16px !important;

                max-height:
                  calc(100vh - 100px) !important;
              }

              .employees-form-grid {
                grid-template-columns:
                  1fr !important;
              }

              .employees-field-full {
                grid-column: auto !important;
              }

              .employees-profile-card {
                grid-template-columns:
                  1fr !important;
              }
            }

          `}</style>

          {/* =================================================
              HERO
          ================================================= */}

          <section className="employees-hero">

            <div className="employees-hero-content">

              <h1>
                Funcionários
              </h1>

              <p className="employees-description">
                Consulte vínculos, remunerações, dependentes e estado laboral.
              </p>

            </div>

            <div className="employees-hero-actions">

              <button
                type="button"
                className="employees-secondary-button"
                onClick={
                  loadEmployees
                }
                disabled={
                  loading
                }
              >
                <CalendarDays
                  size={15}
                />

                Atualizar
              </button>

              <button
                type="button"
                className="employees-primary-button"
                onClick={
                  openCreateModal
                }
              >
                <Plus
                  size={16}
                />

                Adicionar funcionário
              </button>

            </div>

          </section>

          {/* =================================================
              ALERTAS
          ================================================= */}

          {error && (
            <div className="employees-alert employees-alert-error">
              <span>
                {error}
              </span>

              <button
                type="button"
                onClick={() =>
                  setError('')
                }
                style={{
                  border: 0,
                  background:
                    'transparent',
                  cursor: 'pointer',
                  color:
                    'currentColor',
                }}
              >
                <X size={15} />
              </button>
            </div>
          )}

          {success && (
            <div className="employees-alert employees-alert-success">
              <div
                style={{
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap: 8,
                }}
              >
                <CheckCircle2
                  size={16}
                />

                {success}
              </div>

              <button
                type="button"
                onClick={() =>
                  setSuccess('')
                }
                style={{
                  border: 0,
                  background:
                    'transparent',
                  cursor: 'pointer',
                  color:
                    'currentColor',
                }}
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* =================================================
              MÉTRICAS
          ================================================= */}

          <section className="employees-metrics">

            <div className="employees-metric">
              <div className="employees-metric-top">
                <span className="employees-metric-label">
                  Total
                </span>

                <div className="employees-metric-icon">
                  <Users size={17} />
                </div>
              </div>

              <div className="employees-metric-value">
                {
                  employees.length
                }
              </div>

              <div className="employees-metric-detail">
                Colaboradores registados
              </div>
            </div>

            <div className="employees-metric">
              <div className="employees-metric-top">
                <span className="employees-metric-label">
                  Ativos
                </span>

                <div
                  className="employees-metric-icon"
                  style={{
                    color:
                      '#059669',
                    background:
                      '#ecfdf5',
                  }}
                >
                  <CheckCircle2
                    size={17}
                  />
                </div>
              </div>

              <div className="employees-metric-value">
                {
                  activeEmployees
                }
              </div>

              <div className="employees-metric-detail">
                Funcionários ativos
              </div>
            </div>

            <div className="employees-metric">
              <div className="employees-metric-top">
                <span className="employees-metric-label">
                  Dependentes
                </span>

                <div
                  className="employees-metric-icon"
                  style={{
                    color:
                      '#7c3aed',
                    background:
                      '#f5f3ff',
                  }}
                >
                  <Users size={17} />
                </div>
              </div>

              <div className="employees-metric-value">
                {
                  totalDependents
                }
              </div>

              <div className="employees-metric-detail">
                Dependentes fiscais
              </div>
            </div>

            <div className="employees-metric">
              <div className="employees-metric-top">
                <span className="employees-metric-label">
                  Massa salarial
                </span>

                <div
                  className="employees-metric-icon"
                  style={{
                    color:
                      '#0891b2',
                    background:
                      '#ecfeff',
                  }}
                >
                  <CircleDollarSign
                    size={17}
                  />
                </div>
              </div>

              <div
                className="employees-metric-value"
                style={{
                  fontSize:
                    totalPayroll >
                    99999999
                      ? 17
                      : 22,
                }}
              >
                {formatMoney(
                  totalPayroll,
                )}
              </div>

              <div className="employees-metric-detail">
                Salários base ativos
              </div>
            </div>

          </section>

          {/* =================================================
              TABELA
          ================================================= */}

          <section className="employees-workspace">

            <div className="employees-toolbar">

              <div className="employees-search">
                <Search
                  size={16}
                />

                <input
                  value={
                    search
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Pesquisar por nome, NIF, número, cargo ou departamento..."
                />
              </div>

              <div className="employees-filter">

                <span className="employees-filter-label">
                  Estado
                </span>

                <select
                  className="employees-select"
                  value={
                    status
                  }
                  onChange={(
                    event,
                  ) =>
                    setStatus(
                      event
                        .target
                        .value,
                    )
                  }
                >
                  <option value="ALL">
                    Todos os estados
                  </option>

                  <option value="ACTIVE">
                    Ativos
                  </option>

                  <option value="INACTIVE">
                    Inativos
                  </option>

                  <option value="SUSPENDED">
                    Suspensos
                  </option>

                  <option value="TERMINATED">
                    Terminados
                  </option>
                </select>

              </div>

            </div>

            <div className="employees-results">
              <span>
                A mostrar{' '}
                <strong>
                  {
                    filteredEmployees.length
                  }
                </strong>{' '}
                de{' '}
                <strong>
                  {
                    employees.length
                  }
                </strong>{' '}
                funcionários
              </span>

              <span>
                <strong>
                  {
                    inactiveEmployees
                  }
                </strong>{' '}
                não ativos
              </span>
            </div>

            <div className="employees-table-wrap">

              {loading ? (
                <div className="employees-state">
                  <div className="employees-state-icon">
                    <Users size={22} />
                  </div>

                  <div className="employees-state-title">
                    A carregar funcionários...
                  </div>

                  <div className="employees-state-description">
                    Estamos a carregar os
                    dados da sua empresa.
                  </div>
                </div>
              ) : filteredEmployees.length ===
                0 ? (
                <div className="employees-state">

                  <div className="employees-state-icon">
                    <Search size={22} />
                  </div>

                  <div className="employees-state-title">
                    Nenhum funcionário encontrado
                  </div>

                  <div className="employees-state-description">
                    {employees.length ===
                    0
                      ? 'A sua empresa ainda não possui funcionários registados.'
                      : 'Tente alterar a pesquisa ou o filtro de estado.'}
                  </div>

                  {employees.length ===
                    0 && (
                    <button
                      type="button"
                      className="employees-primary-button"
                      style={{
                        marginTop:
                          17,
                      }}
                      onClick={
                        openCreateModal
                      }
                    >
                      <UserPlus
                        size={15}
                      />

                      Adicionar funcionário
                    </button>
                  )}

                </div>
              ) : (
                <table className="employees-table">

                  <thead>
                    <tr>
                      <th>
                        Funcionário
                      </th>

                      <th>
                        NIF
                      </th>

                      <th>
                        Cargo
                      </th>

                      <th>
                        Dependentes
                      </th>

                      <th>
                        Salário base
                      </th>

                      <th>
                        Estado
                      </th>

                      <th>
                        Ações
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredEmployees.map(
                      (
                        employee,
                      ) => {
                        const salary =
                          employee.salaries?.find(
                            (
                              item,
                            ) =>
                              item.active,
                          );

                        return (
                          <tr
                            key={
                              employee.id
                            }
                          >
                            <td>
                              <div className="employees-person">

                                <div className="employees-avatar">
                                  {getInitials(
                                    employee.name,
                                  )}
                                </div>

                                <div>
                                  <div className="employees-person-name">
                                    {
                                      employee.name
                                    }
                                  </div>

                                  <div className="employees-person-number">
                                    Nº{' '}
                                    {
                                      employee.employeeNumber ||
                                      '—'
                                    }
                                  </div>
                                </div>

                              </div>
                            </td>

                            <td>
                              {
                                employee.nif ||
                                '—'
                              }
                            </td>

                            <td>
                              <div
                                style={{
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  gap: 6,
                                }}
                              >
                                <Briefcase
                                  size={
                                    13
                                  }
                                  color="#94a3b8"
                                />

                                {
                                  employee.jobTitle ||
                                  'Não definido'
                                }
                              </div>

                              {employee.department && (
                                <div
                                  style={{
                                    marginTop:
                                      3,
                                    marginLeft:
                                      19,
                                    color:
                                      '#94a3b8',
                                    fontSize:
                                      9,
                                  }}
                                >
                                  {
                                    employee.department
                                  }
                                </div>
                              )}
                            </td>

                            <td>
                              {
                                Number(
                                  employee.dependentCount ||
                                    0,
                                )
                              }
                            </td>

                            <td>
                              <span className="employees-salary">
                                {salary
                                  ? formatMoney(
                                      salary.baseSalary,
                                    )
                                  : 'Não definido'}
                              </span>
                            </td>

                            <td>
                              <span
                                className={
                                  statusClass[
                                    employee.status
                                  ]
                                }
                              >
                                <span className="employees-status-dot" />

                                {
                                  statusLabel[
                                    employee.status
                                  ]
                                }
                              </span>
                            </td>

                            <td>
                              <div className="employees-actions">

                                <button
                                  type="button"
                                  className="employees-action"
                                  onClick={() =>
                                    void openEmployeeDetails(
                                      employee.id,
                                    )
                                  }
                                >
                                  Ver

                                  <ChevronRight
                                    size={
                                      12
                                    }
                                  />
                                </button>

                                <button
                                  type="button"
                                  className="employees-action employees-action-delete"
                                  disabled={
                                    deletingId ===
                                    employee.id
                                  }
                                  onClick={() =>
                                    handleDelete(
                                      employee,
                                    )
                                  }
                                >
                                  <Trash2
                                    size={
                                      12
                                    }
                                  />

                                  {deletingId ===
                                  employee.id
                                    ? 'A remover...'
                                    : 'Remover'}
                                </button>

                              </div>
                            </td>

                          </tr>
                        );
                      },
                    )}
                  </tbody>

                </table>
              )}

            </div>
          </section>

        </div>
      </DashboardLayout>

      {/* MODAL NOVO FUNCIONÁRIO */}

      {renderCreateModal()}

      {/* MODAL VISUALIZAR */}

      {renderEmployeeModal()}
    </>
  );
}
