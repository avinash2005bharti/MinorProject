# Deprecated wrapper - delegating to postgres_tools for PostgreSQL support
from tools.postgres_tools import postgres_tools as mysql_tools, PostgresTools as MySQLTools

__all__ = ["mysql_tools", "MySQLTools"]
