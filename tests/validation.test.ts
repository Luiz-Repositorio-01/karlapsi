import { describe, expect, it } from 'vitest';
import {
  appointmentRequestSchema,
  checkoutSchema,
  contactMessageSchema,
  isValidCpf,
  patientSchema,
  serviceSchema,
} from '@/lib/validation/schemas';

/** Validação de entrada — a barreira que roda no servidor. */

describe('isValidCpf', () => {
  it('aceita CPF com dígitos verificadores corretos', () => {
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it('recusa CPF com dígito verificador errado', () => {
    expect(isValidCpf('52998224726')).toBe(false);
  });

  it('recusa sequências repetidas e tamanhos inválidos', () => {
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('123')).toBe(false);
    expect(isValidCpf('')).toBe(false);
  });
});

describe('appointmentRequestSchema', () => {
  const valid = {
    serviceId: '3f7d9f1a-6b0e-4a2b-8c1d-2e5f6a7b8c9d',
    startsAt: '2026-09-02T12:00:00.000Z',
    fullName: 'Maria Silva',
    email: 'Maria@Example.com',
    phone: '(11) 98888-7777',
    isForDependent: false,
    consentAccepted: true as const,
  };

  it('normaliza e-mail para minúsculas e telefone para dígitos', () => {
    const result = appointmentRequestSchema.parse(valid);
    expect(result.email).toBe('maria@example.com');
    expect(result.phone).toBe('11988887777');
  });

  it('exige o aceite da política de privacidade', () => {
    const result = appointmentRequestSchema.safeParse({ ...valid, consentAccepted: false });
    expect(result.success).toBe(false);
  });

  it('recusa serviço que não é UUID', () => {
    const result = appointmentRequestSchema.safeParse({ ...valid, serviceId: 'servico-1' });
    expect(result.success).toBe(false);
  });

  it('recusa telefone curto', () => {
    const result = appointmentRequestSchema.safeParse({ ...valid, phone: '9999' });
    expect(result.success).toBe(false);
  });

  it('recusa e-mail inválido', () => {
    const result = appointmentRequestSchema.safeParse({ ...valid, email: 'maria@@example' });
    expect(result.success).toBe(false);
  });

  it('aceita atendimento para dependente com nome informado', () => {
    const result = appointmentRequestSchema.parse({
      ...valid,
      isForDependent: true,
      dependentName: 'João Silva',
      birthDate: '2015-04-10',
    });
    expect(result.dependentName).toBe('João Silva');
    expect(result.birthDate).toBe('2015-04-10');
  });
});

describe('contactMessageSchema', () => {
  it('exige mensagem com conteúdo mínimo', () => {
    const result = contactMessageSchema.safeParse({
      name: 'Ana Souza',
      email: 'ana@example.com',
      message: 'oi',
      consentAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it('aceita mensagem válida sem telefone', () => {
    const result = contactMessageSchema.safeParse({
      name: 'Ana Souza',
      email: 'ana@example.com',
      message: 'Gostaria de informações sobre avaliação neuropsicológica.',
      consentAccepted: true,
    });
    expect(result.success).toBe(true);
  });
});

describe('patientSchema', () => {
  it('converte campos vazios em undefined em vez de string vazia', () => {
    const result = patientSchema.parse({
      fullName: 'Carlos Lima',
      cpf: '',
      email: '',
      phone: '',
      birthDate: '',
    });

    expect(result.cpf).toBeUndefined();
    expect(result.email).toBeUndefined();
    expect(result.phone).toBeUndefined();
    expect(result.birthDate).toBeUndefined();
  });

  it('recusa CPF inválido no cadastro', () => {
    const result = patientSchema.safeParse({ fullName: 'Carlos Lima', cpf: '12345678900' });
    expect(result.success).toBe(false);
  });

  it('aceita CPF válido e guarda apenas dígitos', () => {
    const result = patientSchema.parse({ fullName: 'Carlos Lima', cpf: '529.982.247-25' });
    expect(result.cpf).toBe('52998224725');
  });
});

describe('serviceSchema', () => {
  it('recusa slug com caracteres inválidos', () => {
    const result = serviceSchema.safeParse({
      name: 'Avaliação',
      slug: 'Avaliação Neuro',
      durationMinutes: 60,
    });
    expect(result.success).toBe(false);
  });

  it('recusa duração fora da faixa permitida', () => {
    const result = serviceSchema.safeParse({
      name: 'Avaliação',
      slug: 'avaliacao',
      durationMinutes: 5,
    });
    expect(result.success).toBe(false);
  });

  it('aplica valores padrão dos campos booleanos', () => {
    const result = serviceSchema.parse({
      name: 'Avaliação',
      slug: 'avaliacao',
      durationMinutes: 60,
    });

    expect(result.showPricePublicly).toBe(false);
    expect(result.allowsOnlineBooking).toBe(true);
    expect(result.isActive).toBe(true);
  });
});

describe('checkoutSchema', () => {
  it('limita a quantidade máxima por pedido', () => {
    const result = checkoutSchema.safeParse({
      productSlug: 'material-x',
      quantity: 50,
      customerName: 'Ana Souza',
      customerEmail: 'ana@example.com',
      consentAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it('não aceita checkout sem consentimento', () => {
    const result = checkoutSchema.safeParse({
      productSlug: 'material-x',
      customerName: 'Ana Souza',
      customerEmail: 'ana@example.com',
      consentAccepted: false,
    });
    expect(result.success).toBe(false);
  });
});
