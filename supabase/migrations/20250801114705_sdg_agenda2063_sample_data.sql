-- Insert sample SDG-Agenda 2063 alignment data for demonstration
INSERT INTO public.sdg_agenda2063_alignment (sdg_goal, sdg_target, agenda2063_goal, agenda2063_aspiration, alignment_description) VALUES
  (1, '1.1 By 2030, eradicate extreme poverty for all people everywhere', 'Goal 1: A high standard of living for all citizens', 'Aspiration 1: A prosperous Africa based on inclusive growth and sustainable development', 'Both focus on eliminating poverty through inclusive economic growth and ensuring basic needs are met for all citizens across Africa.'),
  (2, '2.1 End hunger and ensure access to safe, nutritious food', 'Goal 5: Agriculture and food security', 'Aspiration 1: A prosperous Africa based on inclusive growth and sustainable development', 'Aligns with transforming agriculture and ensuring food security through modernized farming techniques and sustainable practices.'),
  (3, '3.1 Reduce global maternal mortality ratio', 'Goal 3: Healthy and well-nourished citizens', 'Aspiration 1: A prosperous Africa based on inclusive growth and sustainable development', 'Both prioritize improving health outcomes, with specific focus on maternal health and nutrition as foundations for development.'),
  (4, '4.1 Ensure all children complete free, equitable and quality primary and secondary education', 'Goal 2: Well-educated citizens and skills revolution', 'Aspiration 1: A prosperous Africa based on inclusive growth and sustainable development', 'Education is central to both frameworks, with emphasis on quality, accessibility, and skills development for economic transformation.'),
  (5, '5.5 Ensure women full participation in leadership and decision-making', 'Goal 17: Full gender equality in all spheres of life', 'Aspiration 6: An Africa whose development is people-driven', 'Both advocate for women''s empowerment, leadership participation, and gender equality as drivers of sustainable development.'),
  (6, '6.1 Achieve universal and equitable access to safe and affordable drinking water', 'Goal 1: A high standard of living for all citizens', 'Aspiration 1: A prosperous Africa based on inclusive growth and sustainable development', 'Clean water access is fundamental to both frameworks for improving living standards and supporting economic development.'),
  (7, '7.1 Ensure universal access to affordable, reliable and modern energy services', 'Goal 7: Environmentally sustainable climate resilient economies', 'Aspiration 1: A prosperous Africa based on inclusive growth and sustainable development', 'Both emphasize sustainable energy solutions that support economic growth while protecting the environment.'),
  (8, '8.1 Sustain per capita economic growth in LDCs', 'Goal 4: Transformed economies and job creation', 'Aspiration 1: A prosperous Africa based on inclusive growth and sustainable development', 'Economic transformation and job creation are central to both, with focus on sustainable and inclusive growth patterns.'),
  (9, '9.1 Develop quality, reliable, sustainable infrastructure', 'Goal 10: World class infrastructure', 'Aspiration 2: An integrated continent, politically united', 'Infrastructure development is key to both continental integration and sustainable development, enabling connectivity and economic growth.'),
  (10, '10.1 Achieve and sustain income growth of bottom 40%', 'Goal 1: A high standard of living for all citizens', 'Aspiration 1: A prosperous Africa based on inclusive growth and sustainable development', 'Both focus on reducing inequality and ensuring inclusive growth that benefits all segments of society.'),
  (11, '11.1 Ensure access to adequate, safe housing for all', 'Goal 1: A high standard of living for all citizens', 'Aspiration 1: A prosperous Africa based on inclusive growth and sustainable development', 'Sustainable urbanization and adequate housing are essential for improving living standards and supporting development.'),
  (12, '12.1 Implement sustainable consumption and production patterns', 'Goal 7: Environmentally sustainable climate resilient economies', 'Aspiration 1: A prosperous Africa based on inclusive growth and sustainable development', 'Both promote sustainable resource use and production patterns that protect the environment while supporting economic growth.'),
  (13, '13.1 Strengthen resilience to climate-related hazards', 'Goal 7: Environmentally sustainable climate resilient economies', 'Aspiration 1: A prosperous Africa based on inclusive growth and sustainable development', 'Climate resilience is crucial for both frameworks, ensuring sustainable development in the face of climate change.'),
  (16, '16.1 Reduce violence and related death rates everywhere', 'Goal 11: Democratic values, practices, universal principles of human rights', 'Aspiration 3: An Africa of good governance, democracy, respect for human rights', 'Both emphasize peace, security, and good governance as foundations for sustainable development and human rights protection.'),
  (17, '17.9 Enhance international support for capacity-building in developing countries', 'Goal 20: Africa takes full responsibility for financing her development', 'Aspiration 7: An Africa as a strong, united, resilient and influential global player', 'Both recognize the importance of partnerships and capacity building while emphasizing African ownership of development processes.');

-- Update trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to relevant tables if not already present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at
            BEFORE UPDATE ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;
