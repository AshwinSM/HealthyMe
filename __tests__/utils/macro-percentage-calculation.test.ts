// Test the macro percentage calculation logic
describe('Macro Percentage Calculation', () => {
  it('calculates correct percentages from totals and goals', () => {
    const totalMacros = {
      protein: 90,
      fat: 40,
      carbs: 120,
      fiber: 15,
    };

    const goals = {
      protein: 150,
      fat: 65,
      carbs: 200,
      fiber: 25,
    };

    const calculatePercentages = (totals: typeof totalMacros, nutritionGoals: typeof goals) => {
      return {
        protein: Math.round((totals.protein / nutritionGoals.protein) * 100),
        fats: Math.round((totals.fat / nutritionGoals.fat) * 100),
        carbs: Math.round((totals.carbs / nutritionGoals.carbs) * 100),
        fiber: Math.round((totals.fiber / nutritionGoals.fiber) * 100),
      };
    };

    const result = calculatePercentages(totalMacros, goals);

    expect(result.protein).toBe(60); // 90/150 = 60%
    expect(result.fats).toBe(62);    // 40/65 = 61.5% rounded to 62%
    expect(result.carbs).toBe(60);   // 120/200 = 60%
    expect(result.fiber).toBe(60);   // 15/25 = 60%
  });

  it('handles zero values gracefully', () => {
    const totalMacros = {
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
    };

    const goals = {
      protein: 150,
      fat: 65,
      carbs: 200,
      fiber: 25,
    };

    const calculatePercentages = (totals: typeof totalMacros, nutritionGoals: typeof goals) => {
      return {
        protein: Math.round((totals.protein / nutritionGoals.protein) * 100),
        fats: Math.round((totals.fat / nutritionGoals.fat) * 100),
        carbs: Math.round((totals.carbs / nutritionGoals.carbs) * 100),
        fiber: Math.round((totals.fiber / nutritionGoals.fiber) * 100),
      };
    };

    const result = calculatePercentages(totalMacros, goals);

    expect(result.protein).toBe(0);
    expect(result.fats).toBe(0);
    expect(result.carbs).toBe(0);
    expect(result.fiber).toBe(0);
  });

  it('handles values over 100%', () => {
    const totalMacros = {
      protein: 200, // Over goal
      fat: 100,     // Over goal
      carbs: 250,   // Over goal
      fiber: 30,    // Over goal
    };

    const goals = {
      protein: 150,
      fat: 65,
      carbs: 200,
      fiber: 25,
    };

    const calculatePercentages = (totals: typeof totalMacros, nutritionGoals: typeof goals) => {
      return {
        protein: Math.round((totals.protein / nutritionGoals.protein) * 100),
        fats: Math.round((totals.fat / nutritionGoals.fat) * 100),
        carbs: Math.round((totals.carbs / nutritionGoals.carbs) * 100),
        fiber: Math.round((totals.fiber / nutritionGoals.fiber) * 100),
      };
    };

    const result = calculatePercentages(totalMacros, goals);

    expect(result.protein).toBe(133); // 200/150 = 133%
    expect(result.fats).toBe(154);    // 100/65 = 154%
    expect(result.carbs).toBe(125);   // 250/200 = 125%
    expect(result.fiber).toBe(120);   // 30/25 = 120%
  });
});