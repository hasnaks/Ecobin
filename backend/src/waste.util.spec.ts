import { classifyWaste, POINTS_PER_KG } from './waste.util';

describe('classifyWaste', () => {
  it('classifies common items', () => {
    expect(classifyWaste('banana peel').wasteType).toBe('ORGANIC');
    expect(classifyWaste('Plastic bottle').wasteType).toBe('PLASTIC');
    expect(classifyWaste('glass bottle').wasteType).toBe('GLASS');
    expect(classifyWaste('old phone charger').wasteType).toBe('E_WASTE');
    expect(classifyWaste('soda can').wasteType).toBe('METAL');
    expect(classifyWaste('newspaper').wasteType).toBe('PAPER');
  });

  it('handles unknown items', () => {
    const r = classifyWaste('xyzzy');
    expect(r.found).toBe(false);
    expect(r.wasteType).toBe('UNKNOWN');
  });

  it('has a points rate for every type', () => {
    expect(Object.values(POINTS_PER_KG).every((v) => v > 0)).toBe(true);
  });
});
