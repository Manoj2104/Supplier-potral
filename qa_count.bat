@echo off
cd /d c:\xampp\htdocs\pos
echo select count(*) as products from products; > temp_qa.sql
echo select count(*) as sales from sales; >> temp_qa.sql
echo select count(*) as purchases from purchases; >> temp_qa.sql
echo select count(*) as customers from customers; >> temp_qa.sql
echo select count(*) as suppliers from suppliers; >> temp_qa.sql
echo select count(*) as expenses from expenses; >> temp_qa.sql
echo select count(*) as quotations from quotations; >> temp_qa.sql
echo select count(*) as adjustments from adjustments; >> temp_qa.sql
echo select count(*) as manage_stocks from manage_stocks; >> temp_qa.sql
echo select count(*) as warehouses from warehouses; >> temp_qa.sql
echo select count(*) as transfers from transfers; >> temp_qa.sql
echo select count(*) as users from users; >> temp_qa.sql
echo select count(*) as sale_items from sale_items; >> temp_qa.sql
echo select count(*) as purchase_items from purchase_items; >> temp_qa.sql
echo select count(*) as sales_returns from sales_returns; >> temp_qa.sql
echo select count(*) as purchase_returns from purchase_returns; >> temp_qa.sql
mysql -u root --database=infy-pos < temp_qa.sql
del temp_qa.sql
