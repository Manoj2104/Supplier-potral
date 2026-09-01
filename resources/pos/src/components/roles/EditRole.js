import React, { memo, useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import RoleForm from './RoleForm';
import { fetchRole } from '../../store/action/roleAction';
import MasterLayout from '../MasterLayout';
import { fetchPermissions } from '../../store/action/permissionAction';
import { getFormattedMessage, placeholderText } from "../../shared/sharedMethod";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import TabTitle from '../../shared/tab-title/TabTitle';

const EditRole = (props) => {
    const { roles, fetchRole, fetchPermissions, permissions = [] } = props;
    const { id } = useParams();

    const itemsValue = roles && roles.length === 1 && roles.map((role) => ({
        name: role.attributes?.name || role.name || "",
        permissions: role.attributes?.permissions || role.permissions || []
    }));

    useEffect(() => {
        fetchPermissions();
        fetchRole(id);
    }, [id]);

    const preparePermissions = (permissionsList, selectedPermissions) => {
        let permissionArray = [];
        if (!permissionsList || !Array.isArray(permissionsList)) return permissionArray;

        permissionsList.forEach((permission) => {
            const isSelected = Array.isArray(selectedPermissions) && selectedPermissions.some(
                (p) => String(p.id || p) === String(permission.id)
            );
            const displayName = permission.attributes?.display_name || permission.display_name || permission.name || "";
            permissionArray.push({
                id: permission.id,
                name: displayName,
                selected: isSelected,
                isChecked: isSelected
            });
        });
        return permissionArray;
    };

    const roleData = roles && roles.length === 1 ? (roles[0].attributes || roles[0]) : null;
    const mappedPermissions = preparePermissions(permissions, roleData?.permissions);

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText("role.edit.title")} />
            {roleData && (
                <RoleForm
                    singleRole={itemsValue ? itemsValue[0] : null}
                    id={id}
                    permissionsArray={mappedPermissions}
                />
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { roles, permissions, isLoading } = state;
    return {
        roles,
        permissions,
        isLoading
    };
};

export default connect(mapStateToProps, { fetchRole, fetchPermissions })(memo(EditRole));
