import api from './api';

export type EmployeeSalary = {
  id: string;
  employeeId: string;

  baseSalary: number | string;

  foodAllowance?: number | string | null;
  transportAllowance?: number | string | null;
  otherAllowances?: number | string | null;

  bonuses?: number | string | null;
  commissions?: number | string | null;
  otherIncome?: number | string | null;

  effectiveFrom: string;
  effectiveTo?: string | null;

  active: boolean;

  notes?: string | null;
};

export type EmployeeDependent = {
  id: string;
  employeeId: string;

  name: string;
  relationship?: string | null;
  birthDate?: string | null;

  taxDependent: boolean;
};

export type RemunerationComponent = {
  id: string;
  type: 'SALARY' | 'MEAL_ALLOWANCE' | 'TRANSPORT_ALLOWANCE' | 'HOLIDAY_ALLOWANCE' | 'CHRISTMAS_ALLOWANCE' | 'OVERTIME' | 'BONUS' | 'REPRESENTATION_ALLOWANCE' | 'HOUSING_ALLOWANCE' | 'FAMILY_ALLOWANCE' | 'REIMBURSEMENT' | 'OTHER';
  amount: number | string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  irtTreatment: string;
  inssTreatment: string;
  legalReference?: string | null;
};

export type Employee = {
  id: string;
  tenantId: string;

  employeeNumber?: string | null;

  name: string;

  nif?: string | null;
  socialSecurityNumber?: string | null;
  socialSecurityCategory?:
    | 'STANDARD'
    | 'RETIRED'
    | 'SPECIAL';

  email?: string | null;
  phone?: string | null;
  address?: string | null;

  birthDate?: string | null;
  hireDate?: string | null;
  terminationDate?: string | null;

  jobTitle?: string | null;
  department?: string | null;

  gender?: string | null;
  maritalStatus?: string | null;

  dependentCount: number;

  status:
    | 'ACTIVE'
    | 'INACTIVE'
    | 'SUSPENDED'
    | 'TERMINATED'
    | 'ARCHIVED';

  notes?: string | null;

  createdAt?: string;
  updatedAt?: string;

  salaries?: EmployeeSalary[];
  dependents?: EmployeeDependent[];
  remunerationComponents?: RemunerationComponent[];
};

export type CreateEmployeeData = {
  name: string;

  nif?: string;
  socialSecurityNumber?: string;
  socialSecurityCategory?:
    | 'STANDARD'
    | 'RETIRED'
    | 'SPECIAL';

  email?: string;
  phone?: string;
  address?: string;

  birthDate?: string;
  hireDate?: string;

  jobTitle?: string;
  department?: string;

  gender?: string;
  maritalStatus?: string;

  dependentCount?: number;

  status?: string;

  notes?: string;

  initialSalary?: CreateEmployeeSalaryData;
};

export type UpdateEmployeeData =
  Partial<CreateEmployeeData>;

export type CreateEmployeeSalaryData = {
  baseSalary: number;

  foodAllowance?: number;
  transportAllowance?: number;
  otherAllowances?: number;

  bonuses?: number;
  commissions?: number;
  otherIncome?: number;

  effectiveFrom: string;

  notes?: string;
};

export type CreateEmployeeDependentData = {
  name: string;
  relationship?: string;
  birthDate?: string;
  taxDependent?: boolean;
};

export type CreateRemunerationComponentData = Pick<RemunerationComponent, 'type'> & { amount: number; effectiveFrom: string; effectiveTo?: string; notes?: string };

function unwrap<T>(
  response: any,
): T {
  const data =
    response?.data;

  if (
    data &&
    typeof data === 'object' &&
    'data' in data
  ) {
    return data.data as T;
  }

  return data as T;
}

export async function getEmployees(): Promise<
  Employee[]
> {
  const response =
    await api.get(
      '/employees',
    );

  return (
    unwrap<Employee[]>(
      response,
    ) || []
  );
}

export async function getEmployee(
  id: string,
): Promise<Employee> {
  const response =
    await api.get(
      `/employees/${id}`,
    );

  return unwrap<Employee>(
    response,
  );
}

export async function createEmployee(
  data: CreateEmployeeData,
): Promise<Employee> {
  const response =
    await api.post(
      '/employees',
      data,
    );

  return unwrap<Employee>(
    response,
  );
}

export async function updateEmployee(
  id: string,
  data: UpdateEmployeeData,
): Promise<Employee> {
  const response =
    await api.patch(
      `/employees/${id}`,
      data,
    );

  return unwrap<Employee>(
    response,
  );
}

export async function deleteEmployee(
  id: string,
): Promise<void> {
  await api.delete(
    `/employees/${id}`,
  );
}

export async function addEmployeeSalary(
  employeeId: string,
  data: CreateEmployeeSalaryData,
): Promise<EmployeeSalary> {
  const response =
    await api.post(
      `/employees/${employeeId}/salaries`,
      data,
    );

  return unwrap<EmployeeSalary>(
    response,
  );
}

export async function addRemunerationComponent(employeeId: string, data: CreateRemunerationComponentData): Promise<RemunerationComponent> {
  return unwrap<RemunerationComponent>(await api.post(`/employees/${employeeId}/remuneration-components`, data));
}

export async function endRemunerationComponent(employeeId: string, componentId: string, effectiveTo: string): Promise<RemunerationComponent> {
  return unwrap<RemunerationComponent>(await api.patch(`/employees/${employeeId}/remuneration-components/${componentId}/end`, { effectiveTo }));
}

export async function getEmployeeSalaries(
  employeeId: string,
): Promise<EmployeeSalary[]> {
  const response =
    await api.get(
      `/employees/${employeeId}/salaries`,
    );

  return (
    unwrap<EmployeeSalary[]>(
      response,
    ) || []
  );
}

export async function addEmployeeDependent(
  employeeId: string,
  data: CreateEmployeeDependentData,
): Promise<EmployeeDependent> {
  const response =
    await api.post(
      `/employees/${employeeId}/dependents`,
      data,
    );

  return unwrap<EmployeeDependent>(
    response,
  );
}

export async function getEmployeeDependents(
  employeeId: string,
): Promise<EmployeeDependent[]> {
  const response =
    await api.get(
      `/employees/${employeeId}/dependents`,
    );

  return (
    unwrap<EmployeeDependent[]>(
      response,
    ) || []
  );
}
