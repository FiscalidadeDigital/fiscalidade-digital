import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateCompanyDto } from './update-company.dto';

describe('UpdateCompanyDto companyType compatibility', () => {
  it('aceita uma actualização de city que omite o companyType legado persistido', async () => {
    const dto = plainToInstance(UpdateCompanyDto, { city: 'Benguela' });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('continua a rejeitar um novo companyType inválido', async () => {
    const dto = plainToInstance(UpdateCompanyDto, { city: 'Benguela', companyType: 'SINGLE' });

    const errors = await validate(dto);

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ property: 'companyType' }),
    ]));
  });
});
