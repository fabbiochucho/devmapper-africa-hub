-- Populate SDG-Agenda 2063 alignment data with comprehensive mappings
INSERT INTO public.sdg_agenda2063_alignment (sdg_goal, sdg_target, agenda2063_goal, agenda2063_aspiration, alignment_description) VALUES

-- SDG 1: No Poverty alignment
(1, '1.1: Eradicate extreme poverty', 'Goal 1: A High Standard of Living, Quality of Life and Well Being for All', 'Aspiration 1: A Prosperous Africa', 'Direct alignment as both focus on eliminating poverty and improving living standards across Africa'),
(1, '1.2: Reduce poverty by at least 50%', 'Goal 1: A High Standard of Living, Quality of Life and Well Being for All', 'Aspiration 1: A Prosperous Africa', 'Complementary targets for measurable poverty reduction and improved welfare systems'),

-- SDG 2: Zero Hunger alignment  
(2, '2.1: End hunger and ensure food security', 'Goal 3: Healthy and Well-Nourished Citizens', 'Aspiration 1: A Prosperous Africa', 'Both prioritize food security, nutrition, and sustainable agricultural development'),
(2, '2.4: Sustainable food production systems', 'Goal 5: Modern Agriculture for Increased Productivity', 'Aspiration 1: A Prosperous Africa', 'Shared focus on agricultural transformation and sustainable farming practices'),

-- SDG 3: Good Health and Well-being alignment
(3, '3.1: Reduce maternal mortality', 'Goal 3: Healthy and Well-Nourished Citizens', 'Aspiration 1: A Prosperous Africa', 'Both emphasize universal health coverage and quality healthcare services'),
(3, '3.8: Universal health coverage', 'Goal 3: Healthy and Well-Nourished Citizens', 'Aspiration 1: A Prosperous Africa', 'Direct alignment on achieving universal health coverage and reducing health inequalities'),

-- SDG 4: Quality Education alignment
(4, '4.1: Free primary and secondary education', 'Goal 2: Well Educated Citizens and Skills Revolution', 'Aspiration 1: A Prosperous Africa', 'Both prioritize accessible, quality education and skills development'),
(4, '4.3: Equal access to technical and higher education', 'Goal 2: Well Educated Citizens and Skills Revolution', 'Aspiration 1: A Prosperous Africa', 'Shared emphasis on technical education and human capital development'),

-- SDG 5: Gender Equality alignment
(5, '5.1: End discrimination against women', 'Goal 17: Full Gender Equality in All Spheres', 'Aspiration 6: An Africa Whose Development is People-Driven', 'Both commit to gender equality, women empowerment, and ending discrimination'),
(5, '5.5: Equal participation in leadership', 'Goal 17: Full Gender Equality in All Spheres', 'Aspiration 6: An Africa Whose Development is People-Driven', 'Aligned on women''s political and economic participation and leadership'),

-- SDG 6: Clean Water and Sanitation alignment
(6, '6.1: Universal access to safe drinking water', 'Goal 1: A High Standard of Living, Quality of Life and Well Being for All', 'Aspiration 1: A Prosperous Africa', 'Both prioritize access to clean water and improved sanitation facilities'),
(6, '6.2: Access to adequate sanitation', 'Goal 1: A High Standard of Living, Quality of Life and Well Being for All', 'Aspiration 1: A Prosperous Africa', 'Complementary focus on water security and sanitation infrastructure'),

-- SDG 7: Affordable and Clean Energy alignment
(7, '7.1: Universal access to modern energy', 'Goal 6: Blue/Ocean Economy', 'Aspiration 1: A Prosperous Africa', 'Both emphasize sustainable energy access and renewable energy development'),
(7, '7.2: Increase renewable energy share', 'Goal 6: Blue/Ocean Economy', 'Aspiration 1: A Prosperous Africa', 'Aligned on clean energy transition and sustainable energy systems'),

-- SDG 8: Decent Work and Economic Growth alignment
(8, '8.1: Sustain economic growth', 'Goal 4: Transformed Economies and Job Creation', 'Aspiration 1: A Prosperous Africa', 'Both focus on inclusive economic growth and productive employment'),
(8, '8.5: Full employment and decent work', 'Goal 4: Transformed Economies and Job Creation', 'Aspiration 1: A Prosperous Africa', 'Shared commitment to job creation and decent work opportunities'),

-- SDG 9: Industry, Innovation and Infrastructure alignment
(9, '9.1: Develop quality infrastructure', 'Goal 7: Environmentally Sustainable and Climate Resilient Economies', 'Aspiration 1: A Prosperous Africa', 'Both prioritize infrastructure development and industrialization'),
(9, '9.4: Upgrade infrastructure for sustainability', 'Goal 7: Environmentally Sustainable and Climate Resilient Economies', 'Aspiration 1: A Prosperous Africa', 'Aligned on sustainable industrial development and innovation'),

-- SDG 10: Reduced Inequalities alignment
(10, '10.1: Reduce income inequalities', 'Goal 1: A High Standard of Living, Quality of Life and Well Being for All', 'Aspiration 1: A Prosperous Africa', 'Both address inequality reduction and inclusive development'),
(10, '10.2: Promote social inclusion', 'Goal 18: Engaged and Empowered Youth and Children', 'Aspiration 6: An Africa Whose Development is People-Driven', 'Complementary focus on social inclusion and empowerment'),

-- SDG 11: Sustainable Cities and Communities alignment
(11, '11.1: Safe and affordable housing', 'Goal 1: A High Standard of Living, Quality of Life and Well Being for All', 'Aspiration 1: A Prosperous Africa', 'Both emphasize sustainable urbanization and inclusive cities'),
(11, '11.3: Inclusive urbanization', 'Goal 20: Africa Takes Full Responsibility for Financing Development', 'Aspiration 1: A Prosperous Africa', 'Aligned on planned urbanization and sustainable city development'),

-- SDG 12: Responsible Consumption and Production alignment
(12, '12.2: Sustainable management of natural resources', 'Goal 7: Environmentally Sustainable and Climate Resilient Economies', 'Aspiration 1: A Prosperous Africa', 'Both promote sustainable resource use and circular economy principles'),
(12, '12.8: Promote sustainable lifestyles', 'Goal 7: Environmentally Sustainable and Climate Resilient Economies', 'Aspiration 1: A Prosperous Africa', 'Shared focus on sustainable consumption patterns and green economy'),

-- SDG 13: Climate Action alignment
(13, '13.1: Strengthen climate resilience', 'Goal 7: Environmentally Sustainable and Climate Resilient Economies', 'Aspiration 1: A Prosperous Africa', 'Direct alignment on climate adaptation and mitigation strategies'),
(13, '13.2: Integrate climate measures', 'Goal 7: Environmentally Sustainable and Climate Resilient Economies', 'Aspiration 1: A Prosperous Africa', 'Both mainstream climate considerations into development planning'),

-- SDG 14: Life Below Water alignment
(14, '14.1: Reduce marine pollution', 'Goal 6: Blue/Ocean Economy', 'Aspiration 1: A Prosperous Africa', 'Both focus on marine conservation and sustainable ocean resource management'),
(14, '14.7: Increase economic benefits from sustainable use', 'Goal 6: Blue/Ocean Economy', 'Aspiration 1: A Prosperous Africa', 'Aligned on blue economy development and marine resource sustainability'),

-- SDG 15: Life on Land alignment
(15, '15.1: Conserve and restore terrestrial ecosystems', 'Goal 7: Environmentally Sustainable and Climate Resilient Economies', 'Aspiration 1: A Prosperous Africa', 'Both prioritize biodiversity conservation and ecosystem restoration'),
(15, '15.3: Combat desertification', 'Goal 7: Environmentally Sustainable and Climate Resilient Economies', 'Aspiration 1: A Prosperous Africa', 'Shared focus on land degradation neutrality and sustainable land management'),

-- SDG 16: Peace, Justice and Strong Institutions alignment
(16, '16.1: Reduce violence and related deaths', 'Goal 11: Democratic Values and Practices', 'Aspiration 3: An Africa of Good Governance', 'Both emphasize peace, security, and effective governance institutions'),
(16, '16.6: Develop effective institutions', 'Goal 12: Capable Institutions and Transformative Leadership', 'Aspiration 3: An Africa of Good Governance', 'Direct alignment on institutional effectiveness and good governance'),

-- SDG 17: Partnerships for the Goals alignment
(17, '17.9: Enhanced international support', 'Goal 20: Africa Takes Full Responsibility for Financing Development', 'Aspiration 7: Africa as a Strong, United and Influential Global Player', 'Both emphasize partnerships and Africa''s role in global development'),
(17, '17.14: Enhance policy coherence', 'Goal 19: Africa as a Major Partner in Global Affairs', 'Aspiration 7: Africa as a Strong, United and Influential Global Player', 'Aligned on coherent policies and international cooperation');